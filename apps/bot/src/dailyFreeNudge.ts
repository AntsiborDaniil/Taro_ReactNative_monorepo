import { config } from './config';

export type DailyFreeNudgeResult = {
  sent: number;
  skipped: number;
  failed: number;
};

export type BroadcastDailyFreeResult =
  | { alreadyDone: true }
  | { alreadyDone: false; sent: number; failed: number };

async function postInternalNotify<T>(path: string): Promise<T> {
  const response = await fetch(`${config.apiPublicUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Support-Secret': config.botToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`notify ${path} ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

/** Вызов API: nudge тем, у кого сегодня снова доступен бесплатный слот. */
export function triggerDailyFreeNudges(): Promise<DailyFreeNudgeResult> {
  return postInternalNotify<DailyFreeNudgeResult>(
    '/api/internal/notify/daily-free',
  );
}

/** Вызов API: одноразовый broadcast (идемпотентен на стороне API). */
export function triggerBroadcastDailyFreeOnce(): Promise<BroadcastDailyFreeResult> {
  return postInternalNotify<BroadcastDailyFreeResult>(
    '/api/internal/notify/broadcast-daily-free',
  );
}
