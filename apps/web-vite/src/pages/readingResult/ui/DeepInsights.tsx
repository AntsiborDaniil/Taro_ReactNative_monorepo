import { useMemo, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CARD_FROM_SPREAD_STATE, countSuits, SuitBalance, suitOfCard, TarotCardFace } from '@entities/spread';
import { TarotCardDirection, type TSelectedTarotCard, type TSpreadMemoryStats } from '@legacy-data';
import { Text } from '@shared/ui';
import styles from './DeepInsights.module.css';

type DeepInsightsProps = {
  cards: TSelectedTarotCard[];
  stats?: TSpreadMemoryStats;
  /** card.json загружен — названия карт. */
  namesReady: boolean;
};

/** Придворная карта: в младших арканах ранги 11–14 (Паж, Рыцарь, Королева, Король). */
function isCourt(cardId: string): boolean {
  const id = Number(cardId);
  return Number.isInteger(id) && id >= 22 && id <= 77 && (id - 22) % 14 >= 10;
}

/**
 * Плашки глубокого разбора (без LLM, считает код):
 * 1) «Рисунок расклада» — Старшие / перевёрнутые / придворные + баланс мастей с
 *    приглушёнными отсутствующими мастями;
 * 2) «Твоя история» — статистика за 30 дней из /interpret (memoryStats): сколько
 *    раскладов и карт, повторы карт этого расклада, частые карты месяца.
 */
export function DeepInsights({ cards, stats, namesReady }: DeepInsightsProps): ReactElement {
  const { t, i18n } = useTranslation();
  const ids = cards.map((c) => String(c.id));
  const total = ids.length;
  const major = ids.filter((id) => suitOfCard(id) === 'major').length;
  const reversed = cards.filter((c) => c.direction === TarotCardDirection.Reversed).length;
  const courts = ids.filter(isCourt).length;
  const suitCounts = useMemo(() => countSuits(ids), [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const name = (id: string) => (namesReady ? t(`card:${id}.name`) : t('core:card'));
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language],
  );

  const tiles = [
    { key: 'major', value: `${major}/${total}`, label: t('spread:deep.tile.major') },
    { key: 'reversed', value: `${reversed}/${total}`, label: t('spread:deep.tile.reversed') },
    { key: 'courts', value: String(courts), label: t('spread:deep.tile.courts') },
  ];

  const hasHistory = stats != null && stats.spreadsCount > 0;

  return (
    <div className={styles.root}>
      <section className={styles.panel}>
        <Text role="title" tone="ink50" as="h2" className={styles.title}>
          {t('spread:deep.pattern.title')}
        </Text>
        <dl className={styles.tiles}>
          {tiles.map((tile) => (
            <div key={tile.key} className={styles.tile}>
              <dd className={styles.tileValue}>{tile.value}</dd>
              <dt className={styles.tileLabel}>{tile.label}</dt>
            </div>
          ))}
        </dl>
        <SuitBalance counts={suitCounts} absolute />
      </section>

      {hasHistory ? (
        <section className={styles.panel}>
          <Text role="title" tone="ink50" as="h2" className={styles.title}>
            {t('spread:deep.history.title')}
          </Text>
          <dl className={styles.tiles}>
            <div className={styles.tile}>
              <dd className={styles.tileValue}>{stats.spreadsCount}</dd>
              <dt className={styles.tileLabel}>{t('spread:deep.history.spreads', { count: stats.spreadsCount })}</dt>
            </div>
            <div className={styles.tile}>
              <dd className={styles.tileValue}>{stats.cardsCount}</dd>
              <dt className={styles.tileLabel}>{t('spread:deep.history.cards', { count: stats.cardsCount })}</dt>
            </div>
            {stats.dominantSuit ? (
              <div className={styles.tile}>
                <dd className={styles.tileValue}>{stats.dominantSuit.pct}%</dd>
                <dt className={styles.tileLabel}>{t(`spread:suits.${stats.dominantSuit.suit}`)}</dt>
              </div>
            ) : null}
            {stats.reversedPct != null ? (
              <div className={styles.tile}>
                <dd className={styles.tileValue}>{stats.reversedPct}%</dd>
                <dt className={styles.tileLabel}>{t('spread:deep.tile.reversedMonth')}</dt>
              </div>
            ) : null}
          </dl>

          {stats.repeats.length > 0 ? (
            <div className={styles.group}>
              <Text role="label" tone="accent" as="h3" className={styles.groupTitle}>
                {t('spread:deep.history.repeats')}
              </Text>
              <ul className={styles.list}>
                {stats.repeats.map((r) => (
                  <li key={r.cardId}>
                    <Link to={`/card/${r.cardId}`} state={CARD_FROM_SPREAD_STATE} className={styles.row}>
                      <span className={styles.thumb}>
                        <TarotCardFace cardId={r.cardId} />
                      </span>
                      <span className={styles.rowText}>
                        <Text role="body" tone="ink50" as="span">
                          {name(r.cardId)}
                        </Text>
                        <Text role="micro" tone="ink100" as="span">
                          {t('spread:deep.history.repeatLine', {
                            count: r.count,
                            date: dateFmt.format(new Date(r.lastDate)),
                          })}
                        </Text>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Text role="body" tone="ink100">
              {t('spread:deep.history.noRepeats')}
            </Text>
          )}

          {stats.topCards.length > 0 ? (
            <div className={styles.group}>
              <Text role="label" tone="accent" as="h3" className={styles.groupTitle}>
                {t('spread:deep.history.top')}
              </Text>
              <div className={styles.topRow}>
                {stats.topCards.map((c) => (
                  <Link key={c.cardId} to={`/card/${c.cardId}`} state={CARD_FROM_SPREAD_STATE} className={styles.topCard} aria-label={`${name(c.cardId)}, ×${c.count}`}>
                    <TarotCardFace cardId={c.cardId} />
                    <span className={styles.topBadge} aria-hidden="true">
                      ×{c.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
