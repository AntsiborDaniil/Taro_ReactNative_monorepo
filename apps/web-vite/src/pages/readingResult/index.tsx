import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement, type TouchEvent } from 'react';
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
  useFollowUpSpreadMutation,
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
import { maybeOfferAddToHomeScreen } from '@features/telegramHomeScreen';
import {
  AILoader,
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Header,
  openModal,
  ShareIcon,
  Text,
  Textarea,
  useToast,
} from '@shared/ui';
import styles from './ReadingResult.module.css';

const FOLLOW_UP_MAX = 3;

/** Абзацы ответа AI: пустая строка — граница абзаца. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
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
  const status = useAppSelector((state) => state.spread.status);
  const errorCode = useAppSelector((state) => state.spread.errorCode);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits ?? 0);

  const [interpretSpread, { isLoading: isInterpreting }] = useInterpretSpreadMutation();
  const [followUpSpread, { isLoading: isFollowUpLoading }] = useFollowUpSpreadMutation();
  const [createSpreadHistory] = useCreateSpreadHistoryMutation();
  const [updateSpreadHistory] = useUpdateSpreadHistoryMutation();
  const attempted = useRef(false);
  /** Фоновое сохранение после интерпретации — «Поделиться» ждёт именно его uid. */
  const persistPromise = useRef<Promise<TSpread | null> | null>(null);
  /** Старт горизонтального свайпа по блоку разбора карты. */
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const [cardNsReady, setCardNsReady] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUps, setFollowUps] = useState<Array<{ q: string; a: string }>>([]);

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
  const followUpLeft = FOLLOW_UP_MAX - followUps.length;

  useEffect(() => {
    if (!spread) navigate('/spreads', { replace: true });
    else if (!isComplete) navigate('/reading', { replace: true });
  }, [spread, isComplete, navigate]);

  // Другой расклад (история, ссылка) — читаем снова с первой карты.
  useEffect(() => {
    setActiveCard(0);
    setFollowUps([]);
    setFollowUpQuestion('');
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
      // После первой ценности в Mini App — один раз предложить ярлык на домашний экран.
      void maybeOfferAddToHomeScreen(() => dispatch(openModal({ id: 'add-to-home-screen' })));
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

  const handleFollowUp = async () => {
    if (!spread || !interpretation || isFollowUpLoading || followUpLeft <= 0) return;
    const question = followUpQuestion.trim();
    if (!question) {
      toast.info(t('spread:followUp.empty'));
      return;
    }
    if (spreadCredits <= 0) {
      toast.info(t('spread:followUp.needCredits'));
      dispatch(openModal({ id: 'buy-credits' }));
      return;
    }

    const body = getAIRequestBody({ spread, t, language: i18n.language });
    if (!body) return;

    try {
      const result = await followUpSpread({
        ...body,
        previous_interpretation: [interpretation, ...followUps.map((item) => `Q: ${item.q}\nA: ${item.a}`)].join(
          '\n\n',
        ),
        follow_up_question: question,
      }).unwrap();
      setFollowUps((prev) => [...prev, { q: question, a: result.interpretation }]);
      setFollowUpQuestion('');
      const left = typeof result.spreadCredits === 'number' ? result.spreadCredits : Math.max(spreadCredits - 1, 0);
      toast.success(t('spread:followUp.receipt', { count: left }));
    } catch (err) {
      const rtkError = err as { status?: number; data?: InterpretErrorBody };
      if (rtkError.status === 401) {
        toast.info(t('core:ai.errorProvider'));
        return;
      }
      if (rtkError.status === 429) {
        toast.info(t('spread:followUp.needCredits'));
        dispatch(openModal({ id: 'buy-credits' }));
        return;
      }
      toast.error(t('core:ai.error1'));
    }
  };

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
  const handleDetailTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (!hasManyCards) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleDetailTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!hasManyCards || !swipeStart.current) return;
    const touch = event.changedTouches[0];
    if (!touch) {
      swipeStart.current = null;
      return;
    }
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    swipeStart.current = null;
    // Только явный горизонтальный жест — вертикальный скролл текста не трогаем.
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) goToCard(activeCard + 1);
    else goToCard(activeCard - 1);
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

        {/* 2. Общий разбор — только текст, без лишних подсказок */}
        <section className={styles.summary}>
          <Text role="title" tone="accent" as="h2" className={styles.summaryTitle}>
            {t('spread:summaryTitle')}
          </Text>

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

        {/* 3. Уточнения — отдельный блок: сначала ответы, потом поле */}
        {interpretation && isAuthenticated ? (
          <section className={styles.followUp}>
            <Text role="title" tone="ink50" as="h2" className={styles.sectionTitle}>
              {t('spread:followUp.sectionTitle')}
            </Text>

            {followUps.length > 0 ? (
              <div className={styles.thread}>
                {followUps.map((item, index) => (
                  <div key={`${item.q}-${index}`} className={styles.followUpItem}>
                    <Text role="micro" tone="ink100">
                      {t('spread:followUp.youAsked')}
                    </Text>
                    <Text role="body" tone="ink50" className={styles.followUpQuestion}>
                      {item.q}
                    </Text>
                    <Text role="body" tone="ink50" className={styles.paragraph}>
                      {item.a}
                    </Text>
                  </div>
                ))}
              </div>
            ) : null}

            {followUpLeft > 0 ? (
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
                    onClick={handleFollowUp}
                  >
                    {isFollowUpLoading ? t('spread:followUp.ctaBusy') : t('spread:followUp.cta')}
                  </Button>
                  <Text role="micro" tone="ink100" className={styles.askCap}>
                    {t('spread:followUp.cap', { left: followUpLeft, max: FOLLOW_UP_MAX })}
                  </Text>
                </div>
              </div>
            ) : (
              <Text role="micro" tone="ink100">
                {t('spread:followUp.capReached')}
              </Text>
            )}
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

          <div
            key={`${current.id}-${activeCard}`}
            className={styles.detail}
            aria-live="polite"
            onTouchStart={handleDetailTouchStart}
            onTouchEnd={handleDetailTouchEnd}
          >
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
            </div>
          </div>
        </section>

        {interpretation ? (
          <div className={styles.actions}>
            <Button
              variant="quiet"
              className={styles.actionBtn}
              icon={<ShareIcon width={18} height={18} />}
              loading={isSharing}
              onClick={handleShare}
            >
              {t('core:ai.copy.share')}
            </Button>
            <Button
              variant="quiet"
              quietTone="neutral"
              className={styles.actionBtn}
              onClick={() => navigate('/spreads')}
            >
              {t('spread:newSpread')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
