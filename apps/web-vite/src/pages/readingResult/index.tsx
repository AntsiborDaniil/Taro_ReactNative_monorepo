import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getAIRequestBody,
  isCloudSpread,
  saveSpreadLocally,
  setError,
  setInterpretation,
  setSpreadMeta,
  setStatus,
  TarotCardFace,
  useCreateSpreadHistoryMutation,
  useInterpretSpreadMutation,
  useUpdateSpreadHistoryMutation,
  type InterpretErrorBody,
  type TSpread,
} from '@entities/spread';
import { FavoriteButton } from '@entities/favorites';
import { TarotCardDirection } from '@legacy-data';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { ensureI18nNamespaces } from '@shared/i18n';
import { isWebAuthPending, shouldPromptWebSignIn } from '@shared/lib/webAuthGate';
import { buildSharedReadingUrl, isShareableReadingUid } from '@shared/lib/sharedReadingLink';
import { copyTextToClipboard } from '@shared/lib/web/copyTextToClipboard';
import { isTelegramMiniApp } from '@shared/lib/web/telegramWebApp';
import {
  AILoader,
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Header,
  openModal,
  ShareIcon,
  Text,
  useToast,
} from '@shared/ui';
import styles from './ReadingResult.module.css';

/** Абзацы ответа AI: пустая строка — граница абзаца. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Страница толкования расклада. Карты раскрываются по очереди (переворот), клик по
 * карте или стрелки «назад/вперёд» открывают её разбор в позиции: направление,
 * ключевые слова, значение и совет (ключи card.json из getTarotCardReadings).
 * Ниже — общий разбор от AI (POST /api/interpret запускается сам при первом
 * открытии), «Поделиться» и «Новый расклад». Сохранение в историю — как раньше
 * на /reading.
 */
export default function ReadingResultPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const spread = useAppSelector((state) => state.spread.selectedSpread);
  const status = useAppSelector((state) => state.spread.status);
  const errorCode = useAppSelector((state) => state.spread.errorCode);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);

  const [interpretSpread, { isLoading: isInterpreting }] = useInterpretSpreadMutation();
  const [createSpreadHistory] = useCreateSpreadHistoryMutation();
  const [updateSpreadHistory] = useUpdateSpreadHistoryMutation();
  const attempted = useRef(false);
  /** Фоновое сохранение после интерпретации — «Поделиться» ждёт именно его uid. */
  const persistPromise = useRef<Promise<TSpread | null> | null>(null);

  const [cardNsReady, setCardNsReady] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

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

  useEffect(() => {
    if (!spread) navigate('/spreads', { replace: true });
    else if (!isComplete) navigate('/reading', { replace: true });
  }, [spread, isComplete, navigate]);

  // Другой расклад (история, ссылка) — читаем снова с первой карты.
  useEffect(() => {
    setActiveCard(0);
  }, [spread?.id]);

  /** Облачная запись (POST/PATCH /api/spreads) — только она даёт uid для ссылки. */
  const saveSpreadToCloud = async (value: TSpread): Promise<TSpread | null> => {
    try {
      const saved =
        value.uid && isCloudSpread(value)
          ? await updateSpreadHistory({ uid: value.uid, spread: value }).unwrap()
          : await createSpreadHistory(value).unwrap();
      dispatch(setSpreadMeta({ uid: saved.uid, date: saved.date, packKey: saved.packKey }));
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
    return saved;
  };

  const handleInterpret = async () => {
    if (!spread) return;
    if (!cardNsReady) await ensureI18nNamespaces('card');
    if (isWebAuthPending(sessionLoading)) return;

    if (shouldPromptWebSignIn(isAuthenticated, sessionLoading)) {
      toast.info(t('core:ai.errorProvider'));
      dispatch(setError('auth_required'));
      return;
    }

    const body = getAIRequestBody({ spread, t, language: i18n.language });
    if (!body) {
      // Без тела запроса толкования не будет — страница не должна «висеть» под AILoader.
      dispatch(setError('failed'));
      return;
    }

    dispatch(setStatus('interpreting'));
    track(AnalyticAction.ClickCompleteSpread, { spread: spread.name });

    try {
      const result = await interpretSpread(body).unwrap();
      dispatch(setInterpretation(result.interpretation));
      track(AnalyticAction.GetAIGeneration, { free: false });
      reachMetrikaGoal(MetrikaGoal.aiGeneration, { spreadId: spread.id });
      persistPromise.current = persistSpreadToHistory({ ...spread, interpretation: result.interpretation });
    } catch (err) {
      const rtkError = err as { status?: number; data?: InterpretErrorBody };
      if (rtkError.status === 401) {
        toast.info(t('core:ai.errorProvider'));
        dispatch(setError('auth_required'));
        return;
      }
      if (rtkError.status === 429) {
        dispatch(openModal({ id: 'daily-limit' }));
        dispatch(setError('daily_limit'));
        return;
      }
      toast.error(t('core:ai.error1'));
      dispatch(setError(rtkError.data?.code ?? 'failed'));
    }
  };

  // Толкование запускается само при первом открытии страницы.
  useEffect(() => {
    if (!isComplete || interpretation || !cardNsReady || attempted.current) return;
    if (isWebAuthPending(sessionLoading)) return;
    attempted.current = true;
    void handleInterpret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, interpretation, cardNsReady, sessionLoading]);

  /**
   * Ссылка живёт только у облачной записи. Сохранение после интерпретации —
   * best effort и могло не успеть или упасть, поэтому перед шарингом дожимаем
   * сохранение и берём свежий uid (раньше кнопка в этом случае просто пропадала).
   */
  const ensureShareableUid = async (): Promise<string | null> => {
    if (!spread) return null;

    // Сначала дожидаемся фонового сохранения, иначе создадим вторую запись того же расклада.
    const pending = await persistPromise.current;
    const cloudSpread = pending && isCloudSpread(pending) ? pending : isCloudSpread(spread) ? spread : null;
    const cloudUid = cloudSpread?.uid;
    if (isShareableReadingUid(cloudUid)) return cloudUid;
    if (!isAuthenticated) return null;

    const saved = await saveSpreadToCloud({ ...spread, interpretation });
    const savedUid = saved?.uid;
    return isShareableReadingUid(savedUid) ? savedUid : null;
  };

  const handleShare = async () => {
    if (!spread || !interpretation || isSharing) return;
    track(AnalyticAction.ClickShareSpread, { spread: spread.name });
    setIsSharing(true);

    try {
      const uid = await ensureShareableUid();
      if (!uid) {
        toast.error(
          isAuthenticated ? t('core:ai.copy.shareFailed') : t('core:ai.copy.shareNeedAuth'),
        );
        return;
      }

      const url = buildSharedReadingUrl(uid);
      const title = t(spread.name);

      // Mini App: нативный shareURL клиента Telegram (Bot API 8+).
      const tgShare = window.Telegram?.WebApp?.shareURL;
      if (isTelegramMiniApp() && typeof tgShare === 'function') {
        try {
          tgShare(url, title);
          return;
        } catch {
          // fallback ниже
        }
      }

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ url, title });
          return;
        } catch {
          // отменено или не поддержано — копируем ссылку
        }
      }

      const copied = await copyTextToClipboard(url);
      if (copied) {
        toast.success(t('core:ai.copy.shareSuccess'));
      } else {
        toast.error(t('core:ai.copy.fail'));
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!spread || !isComplete) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" showBack />
        </div>
      </div>
    );
  }

  const isLoading = status === 'interpreting' || isInterpreting;
  /**
   * Толкования ещё нет и ошибки не было — ждём AI. Показываем только оверлей:
   * иначе до старта запроса (загрузка namespace card, ожидание сессии) успевает
   * мелькнуть «готовая» страница результата с пустым разбором.
   */
  const isAwaitingInterpretation = !interpretation && !errorCode;

  if (isAwaitingInterpretation) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title={t(spread.name)} showBack />
        </div>
        <AILoader />
      </div>
    );
  }

  const current = cards[Math.min(activeCard, cards.length - 1)];
  const hasManyCards = cards.length > 1;
  const goToCard = (index: number) => {
    setActiveCard(Math.min(Math.max(index, 0), cards.length - 1));
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
        <Header title={t(spread.name)} showBack />

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

        {/* Карты расклада: раскрываются по очереди, выбранная — с гранью accent-400. */}
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
              onClick={() => setActiveCard(index)}
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

        {/* Боковые стрелки: в раскладе несколько карт, и каждую читают по очереди. */}
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
            <div className={styles.navCounter}>
              <Text role="label" tone="accent">
                {t('spread:flow.cardCounter', { current: activeCard + 1, total: cards.length })}
              </Text>
              <Text role="micro" tone="ink100">
                {t('spread:flow.cardNavHint')}
              </Text>
            </div>
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

        {/* Разбор выбранной карты в её позиции. key — плавная смена панели. */}
        <section key={`${current.id}-${activeCard}`} className={styles.detail} aria-live="polite">
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
              onClick={() => navigate(`/card/${current.id}`)}
            >
              {t('spread:aboutCard')}
            </Button>
            {hasManyCards && activeCard < cards.length - 1 ? (
              <Button
                variant="quiet"
                quietTone="accent"
                icon={<ChevronRightIcon width={16} height={16} />}
                iconPosition="end"
                onClick={() => goToCard(activeCard + 1)}
              >
                {t('spread:flow.nextCard')}
              </Button>
            ) : null}
          </div>
        </section>

        {/* Общий разбор от AI — отдельный блок с кантом, чтобы его не приняли за разбор карты. */}
        <section className={styles.summary}>
          <div className={styles.summaryHead}>
            <Text role="title" tone="ink50" as="h2">
              {t('spread:summaryTitle')}
            </Text>
            <Text role="micro" tone="ink100">
              {t('spread:summaryHint')}
            </Text>
          </div>

          {isLoading ? (
            <AILoader />
          ) : interpretation ? (
            <div className={styles.paragraphs}>
              {paragraphs.map((paragraph, index) => (
                <Text
                  key={index}
                  role="body"
                  tone="ink50"
                  className={styles.paragraph}
                  style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}
                >
                  {paragraph}
                </Text>
              ))}
            </div>
          ) : errorCode ? (
            <div className={styles.error}>
              <Text role="body" tone="ink100">
                {t('core:ai.error1')}
              </Text>
              <Button variant="action" fullWidth onClick={handleInterpret}>
                {t('core:ai.retry')}
              </Button>
            </div>
          ) : null}
        </section>

        {interpretation ? (
          <div className={styles.actions}>
            <Button
              variant="quiet"
              icon={<ShareIcon width={18} height={18} />}
              loading={isSharing}
              onClick={handleShare}
            >
              {t('core:ai.copy.share')}
            </Button>
            <Button variant="quiet" quietTone="neutral" onClick={() => navigate('/spreads')}>
              {t('spread:newSpread')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
