import { TelegramSendError } from './telegramNotify';

export type SendFailureKind =
  /** Бот заблокирован / чат недоступен — больше не слать. */
  | 'blocked'
  /** 429 — подождать retry_after и повторить. */
  | 'rate_limit'
  /** Сеть, таймаут, 5xx — повторит догоняющий прогон. */
  | 'retryable'
  /** Прочие 4xx (кривой запрос) — повтор не поможет. */
  | 'permanent';

export type SendFailure = { kind: SendFailureKind; retryAfterMs?: number };

/** Описания Bot API, при которых писать пользователю больше нельзя. */
const BLOCKED_PATTERNS = [
  /bot was blocked by the user/i,
  /user is deactivated/i,
  /chat not found/i,
  /bot can'?t initiate conversation/i,
  /bot was kicked/i,
  /have no rights to send/i,
];

/** Классификация ошибки sendTelegramMessage (чистая функция, покрыта тестами). */
export function classifyTelegramSendError(error: unknown): SendFailure {
  if (error instanceof TelegramSendError) {
    if (error.status === 429) {
      const sec = error.retryAfterSec ?? 1;
      return { kind: 'rate_limit', retryAfterMs: Math.max(1, sec) * 1000 };
    }
    if (error.status === 403 || BLOCKED_PATTERNS.some((re) => re.test(error.description))) {
      return { kind: 'blocked' };
    }
    if (error.status >= 500) return { kind: 'retryable' };
    return { kind: 'permanent' };
  }
  // fetch failed / AbortError / сетевые ошибки
  return { kind: 'retryable' };
}
