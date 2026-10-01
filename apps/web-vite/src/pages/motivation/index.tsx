import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardDirection } from '@legacy-data';
import { TarotCardFace, pickRandomCard, getTarotCardReadings } from '@entities/spread';
import { FavoriteButton } from '@entities/favorites';
import {
  getMotivationMemoryKey,
  MotivationKey,
  useGenerateMotivationMutation,
  type GenerateMotivationErrorBody,
  type TMotivationItem,
} from '@entities/tarotMotivation';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { ensureI18nNamespaces } from '@shared/i18n';
import { isWebAuthPending, shouldPromptWebSignIn } from '@shared/lib/webAuthGate';
import { AILoader, Button, EmptyState, Header, openModal, Skeleton, Text, useToast } from '@shared/ui';
import styles from './Motivation.module.css';

type MotivationNavState = { key: MotivationKey; params?: Record<string, unknown> } | null;

function readCache(key: MotivationKey): TMotivationItem | null {
  try {
    const raw = window.localStorage.getItem(getMotivationMemoryKey(key));
    return raw ? (JSON.parse(raw) as TMotivationItem) : null;
  } catch {
    return null;
  }
}

function writeCache(item: TMotivationItem): void {
  try {
    window.localStorage.setItem(getMotivationMemoryKey(item.key), JSON.stringify(item));
  } catch {
    /* ignore */
  }
}

/**
 * Перенос apps/web/src/pages/motivation (MotivationScreen) + useMotivation —
 * карта-мотивация, выбранная на /mood («Создать карту») или /goal
 * («Получить награду»): случайная карта + AI-толкование POST /api/motivation/:key
 * (кэш на день в localStorage — getMotivationMemoryKey, 1-в-1 со старым кодом).
 * Параметры сценария передаются через navigate(state), не контекст.
 */
export default function MotivationPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const location = useLocation();
  const requestState = (location.state as MotivationNavState) ?? null;

  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);

  const [cardNsReady, setCardNsReady] = useState(false);
  const [motivation, setMotivation] = useState<TMotivationItem | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef(false);
  const [generateMotivation, { isLoading: isGenerating }] = useGenerateMotivationMutation();

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cached = (requestState?.key ? readCache(requestState.key) : null) ?? readCache(MotivationKey.MoodAndEnergy) ?? readCache(MotivationKey.Habits);
    if (cached) {
      setMotivation(cached);
    }
  }, [requestState?.key]);

  useEffect(() => {
    if (motivation || attempted.current || !cardNsReady || !requestState?.key) return;
    if (isWebAuthPending(sessionLoading)) return;
    if (shouldPromptWebSignIn(isAuthenticated, sessionLoading)) {
      toast.info(t('core:ai.errorProvider', { defaultValue: 'Interpretation service is temporarily unavailable.' }));
      setFailed(true);
      return;
    }

    attempted.current = true;

    const randomCard = pickRandomCard({});
    const selected = getTarotCardReadings({ card: randomCard, keys: ['description'] });

    void generateMotivation({
      key: requestState.key,
      body: {
        language: i18n.language,
        card: { card: t(selected.name), direction: selected.direction ?? TarotCardDirection.Upright },
        params: requestState.params,
      },
    })
      .unwrap()
      .then((result) => {
        const item: TMotivationItem = {
          interpretation: result.interpretation,
          cards: [{ id: selected.id, name: selected.name, direction: selected.direction ?? TarotCardDirection.Upright }],
          key: requestState.key,
          date: new Date().toISOString(),
          uid: `${Date.now()}`,
        };
        writeCache(item);
        setMotivation(item);
      })
      .catch((err: { status?: number; data?: GenerateMotivationErrorBody }) => {
        if (err.status === 401) {
          toast.info(t('core:ai.errorProvider', { defaultValue: 'Interpretation service is temporarily unavailable.' }));
        } else if (err.status === 429) {
          dispatch(openModal({ id: 'daily-limit' }));
        } else {
          toast.error(t('core:ai.error1', { defaultValue: 'The mists of fate have veiled the Tarot cards.' }));
        }
        setFailed(true);
      });
  }, [motivation, cardNsReady, requestState, isAuthenticated, sessionLoading, generateMotivation, i18n.language, t, toast, dispatch]);

  const card = motivation?.cards[0];

  if (!cardNsReady || (isGenerating && !motivation)) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" />
          <Skeleton width="100%" height={320} radius={18} />
          {isGenerating ? <AILoader /> : null}
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" />
          <EmptyState
            title={failed ? t('core:ai.error1', { defaultValue: 'The mists of fate have veiled the Tarot cards.' }) : t('core:stub.missingData.title')}
            action={<Button onClick={() => navigate('/mood')}>{t('core:stub.missingData.button', { defaultValue: 'Go to spreads' })}</Button>}
          />
        </div>
      </div>
    );
  }

  const isReversed = card.direction === TarotCardDirection.Reversed;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title="" />
        <div className={styles.hero}>
          <div className={styles.cardWrap}>
            <TarotCardFace cardId={card.id} direction={card.direction as TarotCardDirection} />
          </div>
          <div className={styles.titleRow}>
            <Text role="title" as="h1" className={styles.title}>
              {t(card.name)}
            </Text>
            <FavoriteButton cardId={card.id} cardName={t(card.name)} />
          </div>
          {isReversed ? (
            <Text role="label" tone="ink100">
              {t('spread:reverseCard')}
            </Text>
          ) : null}
        </div>

        <div className={styles.interpretation}>
          <Text role="body" tone="ink50">
            {motivation.interpretation}
          </Text>
        </div>

        <Button fullWidth onClick={() => navigate('/')}>
          {t('core:finish')}
        </Button>
      </div>
    </div>
  );
}
