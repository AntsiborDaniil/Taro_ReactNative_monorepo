import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getLastLocalPackIndex,
  getLocalHistoryPack,
  openSavedSpread,
  useListSpreadsHistoryQuery,
  type TSpread,
} from '@entities/spread';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { formatHistoryDate } from '@shared/lib/date';
import { EmptyState, Header, ListRow, Button, Skeleton } from '@shared/ui';
import styles from './History.module.css';

type HistorySection = { title: string; data: TSpread[] };

function groupByDay(spreads: TSpread[], todayText: string, yesterdayText: string): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const spread of spreads) {
    if (!spread.date || !spread.uid) continue;
    const day = formatHistoryDate(spread.date, todayText, yesterdayText);
    const last = sections[sections.length - 1];
    if (last?.title === day) {
      last.data.push(spread);
    } else {
      sections.push({ title: day, data: [spread] });
    }
  }
  return sections;
}

/**
 * Перенос apps/web/src/pages/spreadsHistory — авторизован: GET /api/spreads
 * (limit растёт по «Показать ещё» — проще, чем merge-кэш RTK Query при том же
 * объёме данных, что и старая пагинация по 20); гость — localStorage-пачки
 * spreadsPack_<n> (entities/spread/model/localHistory.ts), «Показать ещё»
 * открывает более старую пачку. Клик по строке → openSavedSpread + /reading
 * (уже с готовым interpretation — повторной интерпретации не будет).
 */
export default function HistoryPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);

  const [cloudLimit, setCloudLimit] = useState(40);
  const { data: cloudSpreads, isFetching } = useListSpreadsHistoryQuery(
    { limit: cloudLimit, offset: 0 },
    { skip: !isAuthenticated },
  );

  const lastLocalPackIndex = useMemo(() => getLastLocalPackIndex(), []);
  const [shownLocalPackIndex, setShownLocalPackIndex] = useState(lastLocalPackIndex);

  const localSpreads = useMemo(() => {
    if (isAuthenticated) return [];
    const result: TSpread[] = [];
    for (let index = lastLocalPackIndex; index >= shownLocalPackIndex; index -= 1) {
      result.push(...getLocalHistoryPack(index));
    }
    return result;
  }, [isAuthenticated, lastLocalPackIndex, shownLocalPackIndex]);

  const spreads = isAuthenticated ? (cloudSpreads ?? []) : localSpreads;
  const sections = useMemo(() => groupByDay(spreads, t('core:today'), t('core:yesterday')), [spreads, t]);

  const canLoadMore = isAuthenticated
    ? (cloudSpreads?.length ?? 0) >= cloudLimit
    : shownLocalPackIndex > 0;

  const handleOpen = (spread: TSpread) => {
    dispatch(openSavedSpread(spread));
    navigate('/reading');
  };

  const handleLoadMore = () => {
    if (isAuthenticated) {
      setCloudLimit((prev) => prev + 20);
    } else {
      setShownLocalPackIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const loading = sessionLoading || (isAuthenticated && isFetching && spreads.length === 0);

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('core:page.spreadsHistory')} />

        {loading ? (
          <div className={styles.rows}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height={64} radius={18} />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            title={t('core:history.noSpreads')}
            action={
              <Button variant="action" onClick={() => navigate('/spreads')}>
                {t('core:page.spreadsGroups')}
              </Button>
            }
          />
        ) : (
          <>
            {sections.map((section) => (
              <section key={section.title} className={styles.section}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <div className={styles.rows}>
                  {section.data.map((spread) => (
                    <ListRow
                      key={spread.uid}
                      title={t(spread.name)}
                      subtitle={spread.question || t('spread:catalog.count', { count: spread.cardsCount })}
                      onClick={() => handleOpen(spread)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {canLoadMore ? (
              <Button variant="quiet" className={styles.loadMore} loading={isFetching} onClick={handleLoadMore}>
                {t('core:button.loadMore')}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
