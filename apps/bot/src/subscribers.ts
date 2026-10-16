import { postInternalNotify } from './dailyFreeNudge';

export type SubscriberEvent = 'interaction' | 'blocked' | 'unblocked';

/** Не чаще раза в час на пользователя: реестру нужен факт диалога, а не каждое сообщение. */
const INTERACTION_THROTTLE_MS = 60 * 60 * 1000;
const lastReported = new Map<number, number>();

export function shouldReportInteraction(
  telegramId: number,
  now: number = Date.now(),
  store: Map<number, number> = lastReported,
): boolean {
  const prev = store.get(telegramId);
  if (prev !== undefined && now - prev < INTERACTION_THROTTLE_MS) return false;
  store.set(telegramId, now);
  return true;
}

/** Сообщить API о подписчике бота. Ошибки не пробрасываем: реестр не должен ломать ответ бота. */
export async function reportSubscriber(input: {
  telegramId: number;
  event: SubscriberEvent;
  languageCode?: string | null;
}): Promise<void> {
  try {
    await postInternalNotify('/api/internal/bot-subscribers', {
      attempts: 2,
      timeoutMs: 20_000,
      retryDelaysMs: [3_000],
      body: {
        telegramId: input.telegramId,
        event: input.event,
        languageCode: input.languageCode ?? null,
      },
    });
  } catch (error) {
    // Сбой отчёта → при следующем сообщении попробуем снова.
    lastReported.delete(input.telegramId);
    console.warn(`[bot] subscriber report (${input.event}) failed:`, error);
  }
}

