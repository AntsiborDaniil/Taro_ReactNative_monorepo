import { config } from './config';

/** API отвечает 202 сразу и шлёт в фоне, поэтому итоговых счётчиков бот не получает. */
export type DailyFreeNudgeResult = {
  accepted: boolean;
  /** false — прогон на API уже идёт (повторный вызов не стартует второй). */
  started?: boolean;
};

export type BroadcastDailyFreeResult =
  | { alreadyDone: true }
  | { alreadyDone: false; sent: number; failed: number };

export type PostOptions = {
  /** Попыток всего (первая + ретраи). */
  attempts?: number;
  /** Таймаут одной попытки: Render на холодном старте просыпается до ~минуты. */
  timeoutMs?: number;
  /** Паузы перед 2-й, 3-й… попыткой. */
  retryDelaysMs?: number[];
  body?: unknown;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRY_DELAYS_MS = [5_000, 20_000];

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Повторяем при сети/таймауте, 5xx, 408 и 429; остальные 4xx — сразу ошибка. */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

export async function postInternalNotify<T>(path: string, options: PostOptions = {}): Promise<T> {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const delays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const doFetch = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  let lastError: Error = new Error(`notify ${path}: no attempts`);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let retryable = true;
    try {
      const response = await doFetch(`${config.apiPublicUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Support-Secret': config.botToken,
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const text = await response.text();
      lastError = new Error(`notify ${path} ${response.status}: ${text}`);
      retryable = isRetryableStatus(response.status);
    } catch (error) {
      // Сеть, таймаут (AbortError), обрыв — повторяем.
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (!retryable) throw lastError;

    if (attempt < attempts) {
      const delay = delays[Math.min(attempt - 1, delays.length - 1)] ?? 0;
      console.warn(`[bot] notify ${path} attempt ${attempt}/${attempts} failed: ${lastError.message}; retry in ${delay} ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

/** Вызов API: рассылка «заряд обновился» всем подписчикам бота (API отвечает 202 и шлёт в фоне). */
export function triggerDailyFreeNudges(options?: PostOptions): Promise<DailyFreeNudgeResult> {
  return postInternalNotify<DailyFreeNudgeResult>('/api/internal/notify/daily-free', options);
}

/** Вызов API: одноразовый broadcast (идемпотентен на стороне API). */
export function triggerBroadcastDailyFreeOnce(options?: PostOptions): Promise<BroadcastDailyFreeResult> {
  return postInternalNotify<BroadcastDailyFreeResult>('/api/internal/notify/broadcast-daily-free', options);
}
