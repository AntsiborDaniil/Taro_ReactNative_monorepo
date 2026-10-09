import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getAIRequestBody,
  isCloudSpread,
  normalizeFollowUps,
  saveSpreadLocally,
  CARD_FROM_SPREAD_STATE,
  freePeriodKindOf,
  getFreePeriodCard,
  saveFreePeriodCard,
  FOLLOW_UP_MAX,
  setFollowUps,
  setSpreadMeta,
  TarotCardFace,
  useCreateSpreadHistoryMutation,
  useFollowUpSpreadMutation,
  useUpdateSpreadHistoryMutation,
  type InterpretErrorBody,
  type InterpretResponse,
  type TSpread,
} from '@entities/spread';
import { FavoriteButton } from '@entities/favorites';
import { TarotCardDirection } from '@legacy-data';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { ensureI18nNamespaces } from '@shared/i18n';
import { haptic } from '@shared/lib/haptics';
import { isRtkNetworkError } from '@shared/lib/rtkQueryError';
import { isShareableReadingUid } from '@shared/lib/sharedReadingLink';
import { registerShareProvider } from '@features/shareReading';
import {
  Button,
  ChargeMark,
  ChevronLeftIcon,
  ChevronRightIcon,
  Header,
  openModal,
  ShareIcon,
  Text,
  Textarea,
  useToast,
} from '@shared/ui';
import { DeepInsights } from './ui/DeepInsights';
import { DeepText } from '@widgets/deepText';
import { MemoryNote } from './ui/MemoryNote';
import styles from './ReadingResult.module.css';

/** Абзацы ответа AI: пустая строка — граница абзаца. */
/**
 * Уже запущенные сохранения в историю за жизнь вкладки: ключ «id расклада + текст
 * толкования» → промис сохранения. Защищает от дублей при повторном прогоне эффектов.
 */
const persistedReadings = new Map<string, Promise<TSpread | null>>();

function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Минимальная дельта горизонтального свайпа, px. */
const SWIPE_THRESHOLD = 48;
/** Накопленный deltaX трекпада, после которого переключаем карту. */
const WHEEL_THRESHOLD = 64;
/** Пауза, чтобы один жест трекпада не перескочил сразу несколько карт. */
const WHEEL_COOLDOWN_MS = 380;

/**
 * Обработчики явного горизонтального свайпа (вертикальный скролл не трогаем).
 * Никакого preventDefault/фокуса: страница остаётся на месте.
 */
function createSwipeHandlers(
  startRef: { current: { x: number; y: number } | null },
  enabled: boolean,
  onSwipe: (direction: 1 | -1) => void,
) {
  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      if (!enabled) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!enabled || !start) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      onSwipe(dx < 0 ? 1 : -1);
    },
    onTouchCancel: () => {
      startRef.current = null;
    },
  };
}

/**
 * Двухпальцевый свайп тачпада Mac — это wheel с deltaX, не touch.
 * preventDefault нужен, иначе Chrome уводит «назад» по истории.
 */
function useHorizontalWheelSwipe(
  targetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onSwipe: (direction: 1 | -1) => void,
) {
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    let acc = 0;
    let locked = false;
    let unlockTimer = 0;
    let idleTimer = 0;

    const onWheel = (event: WheelEvent) => {
      const horizontal =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;
      if (!horizontal) return;
      event.preventDefault();
      if (locked) return;
      acc += horizontal;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        acc = 0;
      }, 180);
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      const direction: 1 | -1 = acc > 0 ? 1 : -1;
      acc = 0;
      locked = true;
      onSwipeRef.current(direction);
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        locked = false;
      }, WHEEL_COOLDOWN_MS);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(unlockTimer);
      window.clearTimeout(idleTimer);
    };
  }, [enabled, targetRef]);
}

/** Панель с touch-свайпом и горизонтальным жестом тачпада. */
function SwipePanel({
  enabled,
  onSwipe,
  lockRef,
  className,
  style,
  children,
}: {
  enabled: boolean;
  onSwipe: (direction: 1 | -1) => void;
  lockRef: RefObject<HTMLDivElement | null>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  useHorizontalWheelSwipe(lockRef, enabled, onSwipe);
  const touch = createSwipeHandlers(swipeStart, enabled, onSwipe);

  return (
    <div ref={lockRef} className={className} style={style} aria-live="polite" {...touch}>
      {children}
    </div>
  );
}

/**
 * Панель, чья высота зависит от контента (разбор карты, ответ AI), не должна
 * «схлопываться» при переключении: страница становится короче, браузер
 * подрезает scrollTop и вьюпорт улетает вверх. Держим максимальную высоту
 * просмотренных панелей как min-height до смены расклада.
 */
function useHeightLock(resetKey: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState(0);

  useEffect(() => {
    setMinHeight(0);
  }, [resetKey]);

  const lock = () => {
    const height = ref.current?.offsetHeight ?? 0;
    if (height > 0) setMinHeight((prev) => Math.max(prev, height));
  };

  return { ref, minHeight: minHeight || undefined, lock };
}

/**
 * Страница толкования расклада.
 * Семантика: карты → общий разбор → уточнения → разбор по картам.
 */
export default function ReadingResultPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const spread = useAppSelector((state) => state.spread.selectedSpread);
  /** Открыт по шаренной ссылке: уточнения читаем, задавать новые нельзя. */
  const openedAsShared = useAppSelector((state) => state.spread.openedAsShared);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits ?? 0);

  const [followUpSpread, { isLoading: isFollowUpLoading }] = useFollowUpSpreadMutation();
  const [createSpreadHistory] = useCreateSpreadHistoryMutation();
  const [updateSpreadHistory] = useUpdateSpreadHistoryMutation();
  /** Фоновое сохранение после интерпретации — «Поделиться» ждёт именно его uid. */
  const persistPromise = useRef<Promise<TSpread | null> | null>(null);
  const persistStartedFor = useRef<string | null>(null);
  const [cardNsReady, setCardNsReady] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [activeFollowUp, setActiveFollowUp] = useState(0);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const detailLock = useHeightLock(spread?.id);
  const followUpLock = useHeightLock(spread?.id);

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const cards = spread?.selectedCards ?? [];
  const isComplete = Boolean(spread) && cards.length >= (spread?.cardsCount ?? 0) && cards.length > 0;
  const interpretation = spread?.interpretation?.trim() ?? '';
  const paragraphs = useMemo(() => toParagraphs(interpretation), [interpretation]);
  /** Уточнения живут в раскладе (и в spreads.payload.followUps) — читают все, добавляет только автор. */
  const followUps = useMemo(() => normalizeFollowUps(spread?.followUps), [spread?.followUps]);
  const followUpLeft = FOLLOW_UP_MAX - followUps.length;
  const canAsk = isAuthenticated && !openedAsShared && followUpLeft > 0;
  const followUpOpenTrackedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!spread || !interpretation || !canAsk) return;
    if (followUpOpenTrackedFor.current === spread.id) return;
    followUpOpenTrackedFor.current = spread.id;
    reachMetrikaGoal(MetrikaGoal.followUpOpen, {
      spreadId: spread.id,
      left: followUpLeft,
    });
  }, [spread, interpretation, canAsk, followUpLeft]);

  useEffect(() => {
    if (!spread) {
      navigate('/spreads', { replace: true });
      return;
    }
    if (!isComplete) {
      navigate('/reading', { replace: true });
      return;
    }
    // Толкование делается на /reading до перехода — без текста сюда не пускаем
    // (нет зарядов / сеть / ошибка AI остаются на карусели с модалкой).
    if (!interpretation) {
      navigate('/reading', { replace: true });
    }
  }, [spread, isComplete, interpretation, navigate]);

  // Другой расклад (история, ссылка) — читаем снова с первой карты.
  useEffect(() => {
    setActiveCard(0);
    setActiveFollowUp(0);
    setFollowUpQuestion('');
    followUpOpenTrackedFor.current = null;
    persistStartedFor.current = null;
    persistPromise.current = null;
  }, [spread?.id]);

  /**
   * Карта дня: после сохранения в историю обновляем кэш дня (uid/packKey), чтобы
   * повторное открытие не создавало дубль в истории.
   */
  const rememberDayCard = (value: TSpread) => {
    const kind = freePeriodKindOf(value.id);
    if (!kind || openedAsShared) return;
    if (getFreePeriodCard(kind)) saveFreePeriodCard(kind, value);
  };

  /** Облачная запись (POST/PATCH /api/spreads) — только она даёт uid для ссылки. */
  const saveSpreadToCloud = async (value: TSpread): Promise<TSpread | null> => {
    try {
      const saved =
        value.uid && isCloudSpread(value)
          ? await updateSpreadHistory({ uid: value.uid, spread: value }).unwrap()
          : await createSpreadHistory(value).unwrap();
      dispatch(
        setSpreadMeta({
          uid: saved.uid,
          date: saved.date,
          packKey: saved.packKey,
          shareQuestion: value.shareQuestion === true,
        }),
      );
      rememberDayCard({ ...value, uid: saved.uid, date: saved.date, packKey: saved.packKey });
      return saved;
    } catch {
      return null;
    }
  };

  const persistSpreadToHistory = async (value: TSpread): Promise<TSpread | null> => {
    // История — best effort, ошибка сохранения не должна ломать показ результата.
    if (isAuthenticated) return saveSpreadToCloud(value);
    const saved = saveSpreadLocally(value);
    dispatch(setSpreadMeta({ uid: saved.uid, date: saved.date, packKey: saved.packKey }));
    rememberDayCard(saved);
    return saved;
  };

  // Толкование уже получено на /reading — здесь только сохраняем в историю (для шаринга).
  // Ключ — сам текст толкования: он уникален для расклада. Реестр модульный, а не ref:
  // StrictMode (и повторный маунт) заново прогоняет эффекты, а эффект сброса выше
  // обнуляет ref — с ref-флагом в историю уходило два POST, «карта выпала 2 раза».
  useEffect(() => {
    if (!spread || !interpretation || openedAsShared) return;
    const key = `${spread.id}:${interpretation}`;
    if (persistStartedFor.current === key) return;
    persistStartedFor.current = key;
    const started = persistedReadings.get(key);
    if (started) {
      persistPromise.current = started;
      return;
    }
    const promise = persistSpreadToHistory({ ...spread, interpretation });
    persistedReadings.set(key, promise);
    persistPromise.current = promise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spread?.id, interpretation, openedAsShared, isAuthenticated]);

  const handleFollowUp = async () => {
    // Задавать уточнения может только автор (не читатель шаренной ссылки).
    if (!spread || !interpretation || isFollowUpLoading || !canAsk) return;
    const question = followUpQuestion.trim();
    if (!question) {
      toast.info(t('spread:followUp.empty'));
      return;
    }
    if (spreadCredits <= 0) {
      haptic.notify('warning');
      dispatch(openModal({ id: 'out-of-charges', props: { reason: 'followUp' } }));
      return;
    }

    reachMetrikaGoal(MetrikaGoal.followUpSubmit, {
      spreadId: spread.id,
      index: followUps.length + 1,
    });

    const body = getAIRequestBody({ spread, t, language: i18n.language });
    if (!body) return;

    let result: InterpretResponse;
    try {
      result = await followUpSpread({
        ...body,
        previous_interpretation: [interpretation, ...followUps.map((item) => `Q: ${item.q}\nA: ${item.a}`)].join(
          '\n\n',
        ),
        follow_up_question: question,
      }).unwrap();
    } catch (err) {
      const rtkError = err as { status?: number; data?: InterpretErrorBody };
      if (rtkError.status === 401) {
        toast.info(t('core:ai.errorProvider'));
        return;
      }
      if (rtkError.status === 429) {
        haptic.notify('warning');
        dispatch(openModal({ id: 'out-of-charges', props: { reason: 'followUp' } }));
        return;
      }
      if (isRtkNetworkError(err)) {
        dispatch(openModal({ id: 'network-error' }));
        return;
      }
      toast.error(t('core:ai.error1'));
      return;
    }

    // Заряд уже списан — ответ показываем сразу и сохраняем в расклад (payload.followUps).
    const nextFollowUps = normalizeFollowUps([
      ...followUps,
      { q: question, a: result.interpretation, createdAt: new Date().toISOString() },
    ]);
    dispatch(setFollowUps(nextFollowUps));
    setActiveFollowUp(Math.max(nextFollowUps.length - 1, 0));
    setFollowUpQuestion('');
    const left = typeof result.spreadCredits === 'number' ? result.spreadCredits : Math.max(spreadCredits - 1, 0);
    toast.success(t('spread:followUp.receipt', { count: left }));
    reachMetrikaGoal(MetrikaGoal.followUpSuccess, {
      spreadId: spread.id,
      count: nextFollowUps.length,
    });
    if (nextFollowUps.length >= FOLLOW_UP_MAX) {
      reachMetrikaGoal(MetrikaGoal.followUpCapReached, { spreadId: spread.id });
    }

    // Дожидаемся сохранения толкования (иначе создадим дубль) и пишем уточнения;
    // при провале — тост (ответ на экране есть, но шаринг/история без него).
    const previousPersist = persistPromise.current;
    const nextPersist = (async (): Promise<TSpread | null> => {
      const pending = previousPersist ? await previousPersist.catch(() => null) : null;
      const base: TSpread = pending
        ? { ...spread, uid: pending.uid, date: pending.date, packKey: pending.packKey }
        : spread;
      const withFollowUps: TSpread = { ...base, interpretation, followUps: nextFollowUps };
      let saved = await persistSpreadToHistory(withFollowUps);
      if (!saved) {
        saved = await persistSpreadToHistory(withFollowUps);
      }
      return saved;
    })();
    persistPromise.current = nextPersist;
    const saved = await nextPersist;
    if (!saved) {
      toast.error(t('spread:followUp.saveFailed'));
    }
  };

  /**
   * Ссылка живёт только у облачной записи. Сохранение после интерпретации —
   * best effort и могло не успеть или упасть, поэтому перед шарингом дожимаем
   * сохранение и берём свежий uid (раньше кнопка в этом случае просто пропадала).
   */
  const ensureShareableUid = async (shareQuestion = spread?.shareQuestion === true): Promise<string | null> => {
    if (!spread) return null;

    // Сначала дожидаемся фонового сохранения, иначе создадим вторую запись того же расклада.
    const pending = await persistPromise.current;
    const cloudSpread = pending && isCloudSpread(pending) ? pending : isCloudSpread(spread) ? spread : null;
    const cloudUid = cloudSpread?.uid;
    const wanted = shareQuestion === true;
    // Флаг shareQuestion пишется в payload; если облачная запись уже есть, но флаг другой — обновляем её (PATCH).
    if (isShareableReadingUid(cloudUid) && cloudSpread && (cloudSpread.shareQuestion === true) === wanted) {
      return cloudUid;
    }
    if (!isAuthenticated) return null;

    const base = cloudSpread ? { ...spread, uid: cloudSpread.uid, date: cloudSpread.date, packKey: cloudSpread.packKey } : spread;
    const saved = await saveSpreadToCloud({ ...base, interpretation, shareQuestion: wanted });
    const savedUid = saved?.uid;
    return isShareableReadingUid(savedUid) ? savedUid : null;
  };

  // Лист «Поделиться» (features/shareReading) берёт «дожми сохранение и верни uid» отсюда.
  // Свежая версия ensureShareableUid лежит в ref, чтобы не пересоздавать регистрацию на каждый рендер.
  const ensureUidRef = useRef(ensureShareableUid);
  ensureUidRef.current = ensureShareableUid;
  useEffect(
    () =>
      registerShareProvider({
        ensureUid: (shareQuestion) => ensureUidRef.current(shareQuestion),
        isAuthenticated,
      }),
    [isAuthenticated],
  );

  const openShareSheet = () => {
    if (!spread || !interpretation) return;
    track(AnalyticAction.ClickShareSpread, { spread: spread.name });
    reachMetrikaGoal(MetrikaGoal.shareClick, { spreadId: spread.id });
    haptic.impact('light');
    dispatch(openModal({ id: 'share-reading' }));
  };

  if (!spread || !isComplete || !interpretation) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" showBack />
        </div>
      </div>
    );
  }

  const current = cards[Math.min(activeCard, cards.length - 1)];
  const hasManyCards = cards.length > 1;
  const goToCard = (index: number) => {
    const next = Math.min(Math.max(index, 0), cards.length - 1);
    if (next === activeCard) return;
    // Фиксируем высоту уходящей панели, чтобы страница не укорачивалась и не прыгала.
    detailLock.lock();
    setActiveCard(next);
  };
  const hasManyFollowUps = followUps.length > 1;
  const currentFollowUpIndex = Math.min(activeFollowUp, Math.max(followUps.length - 1, 0));
  const currentFollowUp = followUps[currentFollowUpIndex];
  const goToFollowUp = (index: number) => {
    const next = Math.min(Math.max(index, 0), followUps.length - 1);
    if (next === currentFollowUpIndex) return;
    followUpLock.lock();
    setActiveFollowUp(next);
  };
  const handleCardsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToCard(activeCard - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToCard(activeCard + 1);
    }
  };
  // Тексты карты — ключи card.json; у части (keywords) нет префикса namespace.
  const cardText = (key?: string): string => {
    if (!key) return '';
    const full = key.includes(':') ? key : `card:${key}`;
    return i18n.exists(full) ? t(full) : '';
  };
  const keywords = cardText(current.keywords);
  const meaning = cardText(current.meaning);
  const advice = cardText(current.advice);
  const positionLabel = (index: number) => {
    const meaning = spread.cardsOrder?.[index]?.meaning;
    return meaning ? t(`spread:${meaning}`) : '';
  };
  const reversed = current.direction === TarotCardDirection.Reversed;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header
          title={t(spread.name)}
          showBack
          right={
            openedAsShared ? undefined : (
              <button
                type="button"
                className={styles.headerShare}
                onClick={openShareSheet}
                aria-label={t('spread:share.headerA11y')}
              >
                <ShareIcon width={20} height={20} />
              </button>
            )
          }
        />

        {spread.mode === 'deep' ? (
          <Text role="label" tone="accent" className={styles.deepLabel}>
            {t('spread:deep.subtitle')}
          </Text>
        ) : null}

        {spread.couple ? (
          <Text role="label" tone="accent" className={styles.coupleNames}>
            {t('together:couple.names', { him: spread.couple.him, her: spread.couple.her })}
          </Text>
        ) : null}

        {spread.question ? (
          <div className={styles.question}>
            <Text role="label" tone="accent">
              {t('spread:flow.questionSection')}
            </Text>
            <Text role="lead" tone="ink50">
              «{spread.question}»
            </Text>
          </div>
        ) : null}

        {/* 1. Карты расклада */}
        <div
          className={styles.cards}
          role="tablist"
          aria-label={t('spread:flow.positionsTitle')}
          onKeyDown={handleCardsKeyDown}
        >
          {cards.map((card, index) => (
            <button
              key={`${card.id}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeCard}
              className={[styles.cardItem, index === activeCard ? styles.cardItemActive : ''].join(' ')}
              style={{ animationDelay: `${index * 120}ms` }}
              onClick={() => goToCard(index)}
            >
              <span className={styles.cardFace}>
                <TarotCardFace cardId={card.id} direction={card.direction} />
              </span>
              <Text role="micro" tone={index === activeCard ? 'accent' : 'ink100'} className={styles.cardCaption}>
                {positionLabel(index) || t(card.name)}
              </Text>
            </button>
          ))}
        </div>

        {/* 2. Общий разбор — только текст, без лишних подсказок */}
        <section className={styles.summary}>
          <Text role="title" tone="accent" as="h2" className={styles.summaryTitle}>
            {t('spread:summaryTitle')}
          </Text>

          {/* Лид-слова («Связи.», «Вопросы к себе.», «Шаг на сегодня:») — отдельные плашки. */}
          <DeepText paragraphs={paragraphs} />
        </section>

        {/* Глубокий разбор: рисунок расклада + история за 30 дней (считает код, не модель). */}
        {spread.mode === 'deep' && !openedAsShared ? (
          <DeepInsights cards={spread.selectedCards ?? []} stats={spread.memoryStats} namesReady={cardNsReady} />
        ) : null}

        {/* Память: факт из истории; чужой расклад (шаренная ссылка) — скрыта. */}
        {spread.memoryNote && !openedAsShared && cardNsReady ? <MemoryNote note={spread.memoryNote} /> : null}

        {/* 3. Уточнения — отдельный блок: сначала ответы, потом поле */}
        {/* Тред видят все (в т.ч. по шаренной ссылке), форму — только автор. */}
        {interpretation && (followUps.length > 0 || canAsk) ? (
          <section className={styles.followUp}>
            <Text role="title" tone="ink50" as="h2" className={styles.sectionTitle}>
              {t('spread:followUp.sectionTitle')}
            </Text>

            {currentFollowUp ? (
              <div className={styles.followUpCarousel}>
                {/* Десктоп: стрелки + счётчик (как в разборе по картам). */}
                {hasManyFollowUps ? (
                  <div className={[styles.cardNav, styles.followUpArrows].join(' ')}>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={() => goToFollowUp(currentFollowUpIndex - 1)}
                      disabled={currentFollowUpIndex === 0}
                      aria-label={t('core:button.prev')}
                    >
                      <ChevronLeftIcon width={20} height={20} />
                    </button>
                    <Text role="micro" tone="ink100" className={styles.navCounter}>
                      {t('spread:flow.cardCounter', {
                        current: currentFollowUpIndex + 1,
                        total: followUps.length,
                      })}
                    </Text>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={() => goToFollowUp(currentFollowUpIndex + 1)}
                      disabled={currentFollowUpIndex === followUps.length - 1}
                      aria-label={t('core:button.next')}
                    >
                      <ChevronRightIcon width={20} height={20} />
                    </button>
                  </div>
                ) : null}

                {/* Контейнер стабилен и держит min-height — как и у разбора карт. */}
                <SwipePanel
                  enabled={hasManyFollowUps}
                  onSwipe={(direction) => goToFollowUp(currentFollowUpIndex + direction)}
                  lockRef={followUpLock.ref}
                  className={styles.followUpSlide}
                  style={{ minHeight: followUpLock.minHeight }}
                >
                  <div key={currentFollowUpIndex} className={styles.followUpItem}>
                    <Text role="micro" tone="ink100">
                      {openedAsShared ? t('spread:followUp.authorAsked') : t('spread:followUp.youAsked')}
                    </Text>
                    <Text role="body" tone="ink50" className={styles.followUpQuestion}>
                      {currentFollowUp.q}
                    </Text>
                    <Text role="body" tone="ink50" className={styles.paragraph}>
                      {currentFollowUp.a}
                    </Text>
                  </div>
                </SwipePanel>

                {/* Мобильный: точки (на десктопе скрыты). */}
                {hasManyFollowUps ? (
                  <div className={styles.followUpDots} role="tablist">
                    {followUps.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={index === currentFollowUpIndex}
                        aria-label={t('spread:flow.cardCounter', { current: index + 1, total: followUps.length })}
                        className={[styles.dot, index === currentFollowUpIndex ? styles.dotActive : ''].join(' ')}
                        onClick={() => goToFollowUp(index)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {openedAsShared ? (
              <Text role="micro" tone="ink100">
                {t('spread:followUp.readOnlyHint')}
              </Text>
            ) : canAsk ? (
              <div className={styles.ask}>
                <Textarea
                  label={t('spread:followUp.title')}
                  value={followUpQuestion}
                  onChange={(event) => setFollowUpQuestion(event.target.value)}
                  placeholder={t('spread:followUp.placeholder')}
                  disabled={isFollowUpLoading}
                  rows={2}
                />
                <div className={styles.askActions}>
                  <Button
                    variant="action"
                    className={styles.askCta}
                    loading={isFollowUpLoading}
                    icon={<ChargeMark size="md" onAction />}
                    iconPosition="end"
                    onClick={handleFollowUp}
                  >
                    {isFollowUpLoading ? t('spread:followUp.ctaBusy') : t('spread:followUp.cta')}
                  </Button>
                  <Text role="micro" tone="ink100" className={styles.askCap}>
                    {t('spread:followUp.cap', { left: followUpLeft, max: FOLLOW_UP_MAX })}
                  </Text>
                </div>
              </div>
            ) : followUpLeft <= 0 ? (
              <Text role="micro" tone="ink100">
                {t('spread:followUp.capReached')}
              </Text>
            ) : null}
          </section>
        ) : null}

        {/* 4. Разбор по картам — счётчик в шапке, свайп по панели */}
        <section className={styles.meanings}>
          <div className={styles.meaningsHead}>
            <Text role="title" tone="ink50" as="h2" className={styles.sectionTitle}>
              {t('spread:cardsMeaningTitle')}
            </Text>
            {hasManyCards ? (
              <div className={styles.cardNav}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => goToCard(activeCard - 1)}
                  disabled={activeCard === 0}
                  aria-label={t('core:button.prev')}
                >
                  <ChevronLeftIcon width={20} height={20} />
                </button>
                <Text role="micro" tone="ink100" className={styles.navCounter}>
                  {t('spread:flow.cardCounter', { current: activeCard + 1, total: cards.length })}
                </Text>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => goToCard(activeCard + 1)}
                  disabled={activeCard === cards.length - 1}
                  aria-label={t('core:button.next')}
                >
                  <ChevronRightIcon width={20} height={20} />
                </button>
              </div>
            ) : null}
          </div>

          {/* Контейнер стабилен (без key) и держит min-height: смена карты меняет только содержимое. */}
          <SwipePanel
            enabled={hasManyCards}
            onSwipe={(direction) => goToCard(activeCard + direction)}
            lockRef={detailLock.ref}
            className={styles.detail}
            style={{ minHeight: detailLock.minHeight }}
          >
            <div key={activeCard} className={styles.detailBody}>
            <div className={styles.detailHead}>
              <div className={styles.detailTitles}>
                {positionLabel(activeCard) ? (
                  <Text role="label" tone="accent">
                    {positionLabel(activeCard)}
                  </Text>
                ) : null}
                <Text role="title" tone="ink50" as="h2">
                  {t(current.name)}
                </Text>
              </div>
              <FavoriteButton cardId={current.id} cardName={t(current.name)} size={20} />
            </div>

            <div className={styles.chips}>
              <span className={reversed ? styles.chipReversed : styles.chip}>
                {reversed ? t('spread:reverseCard') : t('spread:uprightCard')}
              </span>
            </div>

            {cardNsReady ? (
              <>
                {keywords ? (
                  <Text role="micro" tone="ink100" className={styles.keywords}>
                    {keywords}
                  </Text>
                ) : null}
                {meaning ? (
                  <Text role="body" tone="ink50">
                    {meaning}
                  </Text>
                ) : null}
                {advice ? (
                  <div className={styles.advice}>
                    <Text role="label" tone="accent">
                      {t('spread:adviceTitle')}
                    </Text>
                    <Text role="body" tone="ink50">
                      {advice}
                    </Text>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className={styles.detailFooter}>
              <Button
                variant="link"
                className={styles.cardLink}
                icon={<ChevronRightIcon width={16} height={16} />}
                iconPosition="end"
                onClick={() => navigate(`/card/${current.id}`, { state: CARD_FROM_SPREAD_STATE })}
              >
                {t('spread:aboutCard')}
              </Button>
            </div>
            </div>
          </SwipePanel>
        </section>

        {interpretation ? (
          <div className={styles.actions}>
            {/* Внизу — только ссылка-возврат к раскладам (DS link); «Поделиться» — иконка в шапке. */}
            <Button variant="link" className={styles.backToSpreads} onClick={() => navigate('/spreads')}>
              {t('spread:backToSpreads')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
