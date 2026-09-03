import { Platform } from 'react-native';

export const YANDEX_METRIKA_COUNTER_ID = 112263887;

export const MetrikaGoal = {
  spreadStarted: 'spread_started',
  spreadCompleted: 'spread_completed',
  aiGeneration: 'ai_generation',
  dailyLimitHit: 'daily_limit_hit',
  guestFreeSpread: 'guest_free_spread',
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

function canTrack(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

type YmQueue = YmFunction & { a?: unknown[]; l?: number };

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
