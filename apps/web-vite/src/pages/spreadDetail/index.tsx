import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findSpreadById, selectSpread, setQuestion, SpreadName } from '@entities/spread';
import { SpreadScheme } from '@features/spreadScheme';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { getImage, DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { Button, EmptyState, Header, Text, Textarea, SmartImage } from '@shared/ui';
import styles from './SpreadDetail.module.css';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';

/**
 * Перенос логики apps/web/src/pages/spreadDescriptionChoice (SpreadDescriptionChoice
 * + SpreadHeroBanner + SpreadStepper + вопрос), без RN-разметки: описание
 * расклада, позиции (список меток cardsOrder — замена SpreadScheme-диаграммы),
 * поле вопроса (для не-simple раскладов), «Сделать расклад» → /reading.
 * Simple-расклады (Да/нет, Карта дня) в старом приложении сразу уходят к выбору
 * карт — тут это просто спред без обязательного вопроса, экран тот же для
 * единообразия (кнопка сразу ведёт дальше).
 */
export default function SpreadDetailPage(): ReactElement {
  const { spreadId } = useParams<{ spreadId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const selectedSpread = useAppSelector((state) => state.spread.selectedSpread);
  const question = useAppSelector((state) => state.spread.question);

  const spread = selectedSpread?.id === spreadId ? selectedSpread : findSpreadById(spreadId);

  useEffect(() => {
    if (spread && selectedSpread?.id !== spread.id) {
      dispatch(selectSpread(spread));
    }
  }, [spread, selectedSpread?.id, dispatch]);

  const [error, setError] = useState(false);

  if (!spread) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" />
          <EmptyState
            title={t('core:stub.missingData.title')}
            action={
              <Button variant="action" onClick={() => navigate('/spreads')}>
                {t('core:stub.missingData.button')}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // Вопрос обязателен для всех раскладов, кроме «Карты дня» — 1-в-1 apps/web
  // checkErrors (`newErrors.question = spread.id !== SpreadName.Simple_DaySuggest`).
  const requiresQuestion = spread.id !== SpreadName.Simple_DaySuggest;
  const heroImage = getImage(['spreads', DECK_STYLE_FLAT, spread.id]);
  const positionLabels = (spread.cardsOrder ?? [])
    .map((item) => (item?.meaning ? t(`spread:${item.meaning}`) : ''))
    .filter(Boolean);

  const handleMakeSpread = () => {
    if (requiresQuestion && !question.trim()) {
      setError(true);
      return;
    }
    setError(false);
    track(AnalyticAction.ClickMakeSpread, { spreadId: spread.id });
    reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: spread.id });
    navigate('/reading');
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t(spread.name)} showBack />

        {heroImage ? (
          <div className={styles.hero}>
            <SmartImage className={styles.heroImage} src={heroImage} />
          </div>
        ) : null}

        <Text role="body" tone="ink100">
          {t(spread.description)}
        </Text>

        {positionLabels.length > 0 ? (
          <div className={styles.panel}>
            <Text role="label" tone="ink100" as="h2">
              {t('spread:flow.positionsTitle')}
            </Text>
            <SpreadScheme spreadId={spread.id} />
            <ol className={styles.positions}>
              {positionLabels.map((label, index) => (
                <li key={`${index}-${label}`} className={styles.position}>
                  <span className={styles.positionIndex}>{index + 1}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {requiresQuestion ? (
          <div className={styles.panel}>
            <Text role="label" tone="ink100" as="h2">
              {t('spread:flow.questionSection')}
            </Text>
            <Textarea
              value={question}
              onChange={(event) => {
                dispatch(setQuestion(event.target.value));
                if (error) setError(false);
              }}
              placeholder={t('spread:question.placeholder')}
              error={error ? t('spread:question.error') : undefined}
              rows={3}
              maxLength={280}
              showCount
            />
          </div>
        ) : null}

        <Button variant="action" fullWidth className={styles.cta} onClick={handleMakeSpread}>
          {t('core:button.makeSpread')}
        </Button>
      </div>
    </div>
  );
}
