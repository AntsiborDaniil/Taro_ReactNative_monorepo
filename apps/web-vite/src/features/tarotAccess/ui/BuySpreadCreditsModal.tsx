import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { isFreePeriodSpread, useListSpreadsHistoryQuery } from '@entities/spread';
import { Button, ChargeMark, Input, Text } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import { haptic } from '@shared/lib/haptics';
import { useAppSelector } from '@shared/lib/store';
import { getLegalDocumentById } from '@legacy-legal';
import { markAwaitingLavaPayment, MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { openExternalPaymentUrl } from '@shared/lib/web/telegramWebApp';
import { isCheckoutEmail } from '../lib/isCheckoutEmail';
import { useLavaCheckoutMutation, useLavaPacksQuery, type CreditPack, type CreditPackId } from '../model/paymentsApi';
import styles from './BuySpreadCreditsModal.module.css';

/** Оферта и возврат рядом с оплатой — требование платёжного провайдера. */
const LEGAL_CONSENT_DOC_IDS = ['offer', 'refund'] as const;

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

export type BuySpreadCreditsModalProps = ModalComponentProps & {
  /** 'spread' — из модалки дневного лимита, 'settings' — из настроек. */
  copyNamespace?: 'settings' | 'spread';
};

/** Пока /packs не ответил — витрина по умолчанию (цены как в apps/api/src/lib/creditPacks.ts). */
const FALLBACK_PACKS: CreditPack[] = [{ id: 'plus3', credits: 3, priceRub: 129 }];

/** Ритм обращения к картам → платных раскладов в неделю (для «хватит примерно на…»). */
type Rhythm = 'rare' | 'weekly' | 'often';
const RHYTHMS: Rhythm[] = ['rare', 'weekly', 'often'];
const PER_WEEK: Record<Rhythm, number> = { rare: 0.75, weekly: 2, often: 5 };
const PACK_FOR_RHYTHM: Record<Rhythm, CreditPackId> = { rare: 'plus3', weekly: 'plus9', often: 'plus15' };

/** Ритм по истории: платные расклады за 30 дней (карты дня/недели/месяца бесплатны — не считаем). */
function rhythmFromHistory(paidLast30: number): Rhythm {
  if (paidLast30 >= 12) return 'often';
  if (paidLast30 >= 4) return 'weekly';
  return 'rare';
}

/**
 * Пополнение зарядов без давления: сначала — «как часто ты обращаешься к картам»
 * (по умолчанию угадываем по истории), под ритм подсвечиваем подходящий пакет и
 * показываем, на сколько его примерно хватит. Выбор всегда за человеком; закрыть —
 * крестиком листа. Пакеты — только с настроенным оффером Lava.
 */
export function BuySpreadCreditsModal({ copyNamespace = 'settings' }: BuySpreadCreditsModalProps): ReactElement {
  const { t: tSpread, i18n } = useTranslation('spread');
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: loadedPacks } = useLavaPacksQuery();
  const packs = loadedPacks && loadedPacks.length > 0 ? loadedPacks : FALLBACK_PACKS;

  // История — только чтобы угадать ритм; без неё начинаем с «иногда».
  const { data: history } = useListSpreadsHistoryQuery({ limit: 60, offset: 0 }, { skip: !isAuthenticated });
  const guessedRhythm = useMemo(() => {
    const since = Date.now() - 30 * DAY_MS;
    const paid = (history ?? []).filter(
      (s) => !isFreePeriodSpread(s.id) && s.date && new Date(s.date).getTime() >= since,
    ).length;
    return rhythmFromHistory(paid);
  }, [history]);

  const [rhythm, setRhythm] = useState<Rhythm | null>(null);
  const activeRhythm = rhythm ?? guessedRhythm;
  const recommendedId = packs.some((p) => p.id === PACK_FOR_RHYTHM[activeRhythm])
    ? PACK_FOR_RHYTHM[activeRhythm]
    : packs[packs.length - 1].id;

  const [packId, setPackId] = useState<CreditPackId | null>(null);
  const selected = packs.find((p) => p.id === packId) ?? packs.find((p) => p.id === recommendedId) ?? packs[0];
  const base = packs.find((p) => p.id === 'plus3');
  const basePerCharge = base ? base.priceRub / base.credits : null;
  const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
  const weeks = Math.max(1, Math.round(selected.credits / PER_WEEK[activeRhythm]));

  const consentDocs = useMemo(
    () =>
      LEGAL_CONSENT_DOC_IDS.map((id) => getLegalDocumentById(id, i18n.language)).filter(
        (document): document is NonNullable<typeof document> => Boolean(document),
      ),
    [i18n.language],
  );

  const user = useAppSelector((state) => state.user.user);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const [lavaCheckout, { isLoading }] = useLavaCheckoutMutation();

  const suggestedEmail = useMemo(() => {
    const email = user?.email?.trim() || '';
    if (!email || SYNTHETIC_TG_EMAIL_RE.test(email)) return '';
    return email;
  }, [user?.email]);

  const [email, setEmail] = useState(suggestedEmail);
  // Почта уже известна и подходит — свёрнута в строку «чек придёт на …».
  const [editingEmail, setEditingEmail] = useState(!isCheckoutEmail(suggestedEmail));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.buyCreditsOpen);
  }, []);

  const pickRhythm = (value: Rhythm) => {
    haptic.selection();
    reachMetrikaGoal(MetrikaGoal.buyRhythmSelect, { rhythm: value });
    setRhythm(value);
    setPackId(null); // подсветка и выбор следуют за ритмом, пока человек сам не выбрал пакет
  };

  const handleBuy = async () => {
    setError(null);
    reachMetrikaGoal(MetrikaGoal.buyCreditsClick, { pack: selected.id });
    const trimmed = email.trim().toLowerCase();
    if (!isCheckoutEmail(trimmed)) {
      setEditingEmail(true);
      setError(tSpread('dailyLimit.emailInvalid'));
      return;
    }

    try {
      const returnPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search || ''}`
          : undefined;
      const result = await lavaCheckout({
        email: trimmed,
        pack: selected.id,
        ...(returnPath ? { returnPath } : {}),
      }).unwrap();
      if (!result.paymentUrl) {
        setError(tSpread('dailyLimit.buyFailed'));
        return;
      }
      markAwaitingLavaPayment(spreadCredits ?? 0);
      const opened = openExternalPaymentUrl(result.paymentUrl);
      if (!opened) {
        setError(tSpread('dailyLimit.buyFailed'));
      }
    } catch (err) {
      const rtkError = err as { status?: number; data?: { code?: string; message?: string } };
      const code = rtkError.data?.code;
      if (rtkError.status === 503 || code === 'lava_not_configured' || code === 'pack_unavailable') {
        setError(tSpread('dailyLimit.buyUnavailable'));
      } else if (rtkError.status === 401) {
        setError(tSpread('dailyLimit.buyUnauthorized'));
      } else if (rtkError.status === 400 || code === 'invalid_email') {
        setEditingEmail(true);
        setError(rtkError.data?.message?.trim() || tSpread('dailyLimit.emailInvalid'));
      } else {
        setError(rtkError.data?.message?.trim() || tSpread('dailyLimit.buyFailed'));
      }
    }
  };

  return (
    <div className={styles.inner}>
      <div className={styles.balanceCard}>
        <span className={styles.balanceIcon} aria-hidden="true">
          <ChargeMark size="md" />
        </span>
        <span className={styles.balanceText}>
          <Text role="label" tone="accent" as="span">
            {tSpread('buyPacks.balanceLabel')}
          </Text>
          <Text role="body" tone="ink50" as="span">
            {tSpread('buyPacks.balance', { count: spreadCredits ?? 0 })}
          </Text>
        </span>
      </div>

      <Text role="body" tone="ink100" className={styles.lead}>
        {copyNamespace === 'spread' ? tSpread('buyPacks.leadLimitSoft') : tSpread('buyPacks.leadSoft')}
      </Text>

      <section className={styles.rhythm}>
        <Text role="label" tone="ink100" as="h3" className={styles.sectionTitle}>
          {tSpread('buyPacks.rhythm.title')}
        </Text>
        <div className={styles.rhythmChips} role="radiogroup" aria-label={tSpread('buyPacks.rhythm.title')}>
          {RHYTHMS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={activeRhythm === value}
              className={[styles.segment, activeRhythm === value ? styles.segmentOn : ''].filter(Boolean).join(' ')}
              onClick={() => pickRhythm(value)}
              disabled={isLoading}
            >
              {tSpread(`buyPacks.rhythm.${value}`)}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.packs} role="radiogroup" aria-label={tSpread('buyPacks.choose')}>
        {packs.map((pack) => {
          const perCharge = Math.round(pack.priceRub / pack.credits);
          const discount =
            basePerCharge && pack.id !== 'plus3'
              ? Math.round((1 - pack.priceRub / pack.credits / basePerCharge) * 100)
              : 0;
          const active = pack.id === selected.id;
          const fits = pack.id === recommendedId;
          return (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={[styles.pack, active ? styles.packActive : ''].filter(Boolean).join(' ')}
              onClick={() => {
                haptic.selection();
                reachMetrikaGoal(MetrikaGoal.buyPackSelect, { pack: pack.id });
                setPackId(pack.id);
              }}
              disabled={isLoading}
            >
              <span className={styles.packRadio} aria-hidden="true" />
              <span className={styles.packMain}>
                <span className={styles.packTitle}>
                  <span className={styles.packCredits}>
                    +{pack.credits}
                    <ChargeMark size="sm" />
                  </span>
                  {fits ? <span className={styles.packFits}>{tSpread('buyPacks.fits')}</span> : null}
                </span>
                <span className={styles.packWhat}>{tSpread(`buyPacks.what.${pack.id}`)}</span>
              </span>
              <span className={styles.packPriceCol}>
                <span className={styles.packPrice}>{rub(pack.priceRub)}</span>
                <span className={styles.packPer}>
                  {tSpread('buyPacks.perChargeShort', { price: rub(perCharge) })}
                  {discount > 0 ? ` · −${discount}%` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Наглядно: сколько зарядов и на сколько их примерно хватит при выбранном ритме. */}
      <div className={styles.preview} aria-live="polite">
        <span className={styles.dots} aria-hidden="true">
          {Array.from({ length: selected.credits }, (_, i) => (
            <span key={`${selected.id}-${i}`} className={styles.dot} style={{ animationDelay: `${i * 30}ms` }} />
          ))}
        </span>
        <Text role="micro" tone="ink100" as="p" className={styles.previewText}>
          {tSpread('buyPacks.lasts', { count: weeks })}
        </Text>
      </div>

      <div className={styles.emailWrap}>
        {editingEmail ? (
          <>
            <Input
              label={tSpread('dailyLimit.emailLabel')}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect="off"
              type="email"
              placeholder={tSpread('dailyLimit.emailPlaceholder')}
              disabled={isLoading}
              error={error ?? undefined}
            />
            <Text role="micro" tone="ink100" className={styles.hint}>
              {tSpread('dailyLimit.emailHint')}
            </Text>
          </>
        ) : (
          <p className={styles.receipt}>
            <Text role="micro" tone="ink100" as="span">
              {tSpread('buyPacks.receiptTo', { email })}
            </Text>{' '}
            <button type="button" className={styles.receiptEdit} onClick={() => setEditingEmail(true)}>
              {tSpread('buyPacks.changeEmail')}
            </button>
          </p>
        )}
        {!editingEmail && error ? (
          <Text role="micro" tone="alarm" className={styles.hint}>
            {error}
          </Text>
        ) : null}
      </div>

      <Button variant="action" fullWidth loading={isLoading} onClick={handleBuy}>
        {isLoading ? tSpread('dailyLimit.buyLoading') : tSpread('buyPacks.pay', { price: rub(selected.priceRub) })}
      </Button>

      <Text role="micro" tone="ink100" as="p" className={styles.reassure}>
        {tSpread('buyPacks.reassure')}
      </Text>

      <p className={styles.legalRow}>
        {consentDocs.map((document, index) => (
          <span key={document.id}>
            {index > 0 ? <span className={styles.legalSep}>·</span> : null}
            <a
              className={styles.legalLink}
              href={`/legal/${document.slug}.html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {document.title}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
