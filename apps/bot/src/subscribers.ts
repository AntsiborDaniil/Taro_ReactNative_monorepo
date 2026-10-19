import { postInternalNotify } from './dailyFreeNudge';

export type SubscriberEvent = 'interaction' | 'blocked' | 'unblocked';

/** Не чаще раза в час на пользователя: реестру нужен факт диалога, а не каждое сообщение. */
const INTERACTION_THROTTLE_MS = 60 * 60 * 1000;

export type ReportedInteraction = { at: number; languageCode: string | null };
const lastReported = new Map<number, ReportedInteraction>();

/**
 * Троттлинг отчёта 'interaction'. Смена language_code (не пустого) отправляется сразу,
 * в обход троттлинга: от него зависит язык рассылки 10:00.
 */
export function shouldReportInteraction(
  telegramId: number,
  now: number = Date.now(),
  store: Map<number, ReportedInteraction> = lastReported,
  languageCode?: string | null,
): boolean {
  const lang = languageCode?.trim() || null;
  const prev = store.get(telegramId);
  const langChanged = prev !== undefined && lang !== null && lang !== prev.languageCode;
  if (prev !== undefined && !langChanged && now - prev.at < INTERACTION_THROTTLE_MS) return false;
  store.set(telegramId, { at: now, languageCode: lang ?? prev?.languageCode ?? null });
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

