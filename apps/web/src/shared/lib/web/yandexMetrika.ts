import { Platform } from 'react-native';

export const YANDEX_METRIKA_COUNTER_ID = 112263887;

export const MetrikaGoal = {
  spreadStarted: 'spread_started',
  spreadCompleted: 'spread_completed',
  aiGeneration: 'ai_generation',
  dailyLimitHit: 'daily_limit_hit',
  guestFreeSpread: 'guest_free_spread',
  buyCreditsOpen: 'buy_credits_open',
  buyCreditsClick: 'buy_credits_click',
  paymentSuccess: 'payment_success',
  miniappOpen: 'miniapp_open',
  authTelegram: 'auth_telegram',
} as const;

type MetrikaGoalId = (typeof MetrikaGoal)[keyof typeof MetrikaGoal];

type YmFunction = (
  counterId: number,
  method: string,
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    ym?: YmFunction;
  }
}

const TAG_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`;
const AWAITING_PAYMENT_KEY = 'tarot_awaiting_lava_payment';
const AWAITING_CREDITS_KEY = 'tarot_awaiting_lava_credits';
const MINIAPP_OPEN_KEY = 'tarot_metrika_miniapp_open';
const AUTH_TELEGRAM_KEY = 'tarot_metrika_auth_telegram';
const PAYMENT_SUCCESS_KEY = 'tarot_metrika_payment_success';

function canTrack(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

type YmQueue = YmFunction & { a?: unknown[]; l?: number };

function sessionFlagOnce(key: string): boolean {
  if (typeof sessionStorage === 'undefined') {
    return true;
  }
  try {
    if (sessionStorage.getItem(key) === '1') {
      return false;
    }
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export function injectYandexMetrika(): void {
  if (!canTrack() || typeof document === 'undefined') {
    return;
  }

  const existing = window.ym as YmQueue | undefined;
  if (typeof existing === 'function' && existing.l) {
    return;
  }

  const ym = function ymStub(...args: unknown[]) {
    (ym.a = ym.a || []).push(args);
  } as YmQueue;
  ym.l = Date.now();
  window.ym = ym;

  if (![...document.scripts].some((script) => script.src === TAG_SRC)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = TAG_SRC;
    document.head.appendChild(script);
  }

  window.ym(YANDEX_METRIKA_COUNTER_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

export function reachMetrikaGoal(
  goal: MetrikaGoalId,
  params?: Record<string, unknown>
): void {
  if (!canTrack()) {
    return;
  }

  window.ym?.(YANDEX_METRIKA_COUNTER_ID, 'reachGoal', goal, params);
}

/** Once per tab session when running inside Telegram Mini App. */
export function trackMetrikaMiniAppOpen(): void {
  if (!canTrack()) {
    return;
  }
  const inTelegram = Boolean(window.Telegram?.WebApp?.initData?.trim());
  if (!inTelegram || !sessionFlagOnce(MINIAPP_OPEN_KEY)) {
    return;
  }
  reachMetrikaGoal(MetrikaGoal.miniappOpen);
}

/** Once per tab session after successful Telegram Mini App auth. */
export function trackMetrikaAuthTelegram(): void {
  if (!canTrack() || !sessionFlagOnce(AUTH_TELEGRAM_KEY)) {
    return;
  }
  reachMetrikaGoal(MetrikaGoal.authTelegram);
}

export function markAwaitingLavaPayment(currentCredits: number): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(AWAITING_PAYMENT_KEY, '1');
    sessionStorage.setItem(
      AWAITING_CREDITS_KEY,
      String(Math.max(0, Math.floor(currentCredits)))
    );
    // Allow another payment_success in the same tab after a new checkout.
    sessionStorage.removeItem(PAYMENT_SUCCESS_KEY);
  } catch {
    // ignore
  }
}

function clearAwaitingLavaPayment(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(AWAITING_PAYMENT_KEY);
    sessionStorage.removeItem(AWAITING_CREDITS_KEY);
  } catch {
    // ignore
  }
}

function readLavaReturnSignal(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lava') === 'success') {
      return true;
    }
  } catch {
    // ignore
  }
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  return typeof startParam === 'string' && startParam === 'lava_success';
}

/**
 * Fire payment_success once when:
 * - return URL / start_param says lava_success, or
 * - user came back after checkout and credits increased.
 */
export function trackMetrikaPaymentSuccessIfNeeded(
  currentCredits?: number
): void {
  if (!canTrack()) {
    return;
  }

  const fromReturn = readLavaReturnSignal();
  let fromCredits = false;

  if (typeof sessionStorage !== 'undefined') {
    try {
      const awaiting = sessionStorage.getItem(AWAITING_PAYMENT_KEY) === '1';
      if (awaiting && typeof currentCredits === 'number') {
        const before = Number(sessionStorage.getItem(AWAITING_CREDITS_KEY) || '0');
        if (Number.isFinite(before) && currentCredits > before) {
          fromCredits = true;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!fromReturn && !fromCredits) {
    return;
  }

  if (!sessionFlagOnce(PAYMENT_SUCCESS_KEY)) {
    clearAwaitingLavaPayment();
    return;
  }

  reachMetrikaGoal(MetrikaGoal.paymentSuccess, {
    source: fromReturn ? 'return' : 'credits',
  });
  clearAwaitingLavaPayment();
}
