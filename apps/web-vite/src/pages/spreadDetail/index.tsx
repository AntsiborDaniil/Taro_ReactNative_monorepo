import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findSpreadById, freePeriodKindOf, selectSpread, setQuestion, SpreadName, type FreePeriodKind } from '@entities/spread';
import { useOpenFreePeriodCard } from '@features/freePeriodCard';
import { SpreadScheme } from '@features/spreadScheme';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { getImage, DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { Button, ChargeMark, EmptyState, Header, openModal, Text, Textarea, SmartImage } from '@shared/ui';
import { TogetherActions } from './ui/TogetherActions';
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
/** «Как это работает» у карт периода: ключи spread:<prefix>.how.* */
const DAY_ADVICE_STEPS = ['breath', 'draw', 'read', 'return'] as const;
/** «Как это работает» у раскладов «Вместе»: ключи together:<couple|pair>.how.* */
const TOGETHER_STEPS = ['1', '2', '3'] as const;
const TOGETHER_KIND: Partial<Record<SpreadName, string>> = {
  [SpreadName.Together_Couple]: 'couple',
  [SpreadName.Together_Pair]: 'pair',
};
const HOW_PREFIX: Record<FreePeriodKind, string> = {
  day: 'daySuggest',
  week: 'period_weekCard',
  month: 'period_monthCard',
};

/** «через 5 ч» / «через 3 дн.» до открытия следующей карты периода. */
function timeUntil(nextAt: string | null, lang: string): string | null {
  if (!nextAt) return null;
  const ms = new Date(nextAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'always', style: 'short' });
  const hours = Math.ceil(ms / 3_600_000);
  return hours < 24 ? rtf.format(hours, 'hour') : rtf.format(Math.ceil(hours / 24), 'day');
}

export default function SpreadDetailPage(): ReactElement {
  const { spreadId } = useParams<{ spreadId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { open: openFreeCard, stateOf } = useOpenFreePeriodCard();
  const dispatch = useAppDispatch();

  const selectedSpread = useAppSelector((state) => state.spread.selectedSpread);
  const question = useAppSelector((state) => state.spread.question);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);

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

  // Карты дня/недели/месяца бесплатны (одна на период), остальные расклады тратят заряд.
  const freeKind = freePeriodKindOf(spread.id);
  const freeState = freeKind ? stateOf(spread) : null;
  // «Вместе» (влюблённые / друзья) — своя форма и свой CTA (ui/TogetherActions).
  const togetherKind = TOGETHER_KIND[spread.id] ?? null;
  const isTogether = togetherKind !== null;
  const isPaid = !freeKind && !isTogether;
  // Вопрос не обязателен для карт периода и «Утро, день, вечер».
  const requiresQuestion = isPaid && spread.id !== SpreadName.Simple_DayParts;
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
    // Карта периода: уже открыта — показываем её, иначе новый расклад (сервер проверит период).
    if (freeKind) {
      track(AnalyticAction.ClickMakeSpread, { spreadId: spread.id });
      reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: spread.id });
      openFreeCard(spread);
      return;
    }
    // Нет ни дневного ⚡, ни купленных зарядов — сразу говорим об этом, а не после
    // выбора карт. Пока квота не пришла (tarotDaily null) — пускаем: сервер всё равно проверит.
    if (isPaid && isAuthenticated && tarotDaily) {
      const remaining = Math.max(0, tarotDaily.limit - tarotDaily.used) + (spreadCredits ?? 0);
      if (remaining < 1) {
        dispatch(openModal({ id: 'out-of-charges' }));
        return;
      }
    }
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

        {freeKind ? (
          <div className={styles.panel}>
            <Text role="label" tone="ink100" as="h2">
              {t('spread:daySuggest.howTitle')}
            </Text>
            <ol className={styles.positions}>
              {DAY_ADVICE_STEPS.map((key, index) => (
                <li key={key} className={styles.position}>
                  <span className={styles.positionIndex}>{index + 1}</span>
                  <span>{t(`spread:${HOW_PREFIX[freeKind]}.how.${key}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {isTogether ? (
          <div className={styles.panel}>
            <Text role="label" tone="ink100" as="h2">
              {t(`together:${togetherKind}.how.title`)}
            </Text>
            <ol className={styles.positions}>
              {TOGETHER_STEPS.map((key, index) => (
                <li key={key} className={styles.position}>
                  <span className={styles.positionIndex}>{index + 1}</span>
                  <span>
                    {t(`together:${togetherKind}.how.${key}`)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {positionLabels.length > 0 && !freeKind ? (
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

        {isTogether ? <TogetherActions spread={spread} /> : null}

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
              placeholder={t(`spread:${spread.id}.questionPlaceholder`, {
                defaultValue: t('spread:question.placeholder'),
              })}
              error={error ? t('spread:question.error') : undefined}
              rows={3}
              maxLength={280}
              showCount
            />
          </div>
        ) : null}

        {isTogether ? null : (
        <Button
          variant="action"
          fullWidth
          className={styles.cta}
          onClick={handleMakeSpread}
          icon={isPaid ? <ChargeMark size="md" onAction /> : undefined}
          iconPosition="end"
          aria-label={isPaid ? `${t('core:button.makeSpread')}, ${t('core:charge.a11y', { count: 1 })}` : undefined}
        >
          {isPaid
            ? t('core:button.makeSpread')
            : freeState?.used
              ? t(`spread:freeCard.open.${freeKind}`)
              : t(`spread:${HOW_PREFIX[freeKind as FreePeriodKind]}.cta`)}
        </Button>
        )}
        {freeKind && freeState?.used ? (
          <Text role="micro" tone="ink100" className={styles.nextHint}>
            {t(`spread:freeCard.next.${freeKind}`)}
            {timeUntil(freeState.nextAt, i18n.language) ? ` · ${timeUntil(freeState.nextAt, i18n.language)}` : ''}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
