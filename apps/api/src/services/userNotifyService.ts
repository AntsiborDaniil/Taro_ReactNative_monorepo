import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';
import { buildWebAppDeepLink, sendTelegramMessage } from '../lib/telegramNotify';

/** telegram_id пользователя (если он входил через Telegram), иначе null. */
export async function getTelegramIdForUser(userId: string): Promise<number | null> {
  if (useMemoryBackend()) {
    return memory.memoryGetTelegramId(userId);
  }
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('profiles').select('telegram_id').eq('id', userId).maybeSingle();
  const raw = data?.telegram_id;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw);
  return null;
}

/**
 * Сообщение пользователю от бота с кнопкой «Открыть» (web_app на путь приложения).
 * Soft-fail: любая ошибка (нет telegram_id, бот недоступен) только логируется —
 * основная операция из-за уведомления не падает.
 */
export async function notifyUserSoft(input: {
  userId: string;
  text: string;
  path: string;
  lang: 'ru' | 'en';
  buttonText?: string;
}): Promise<boolean> {
  try {
    const telegramId = await getTelegramIdForUser(input.userId);
    if (!telegramId) return false;
    if (useMemoryBackend()) {
      console.log(`[notify:dev] tg=${telegramId} path=${input.path} text=${input.text}`);
      return true;
    }
    await sendTelegramMessage({
      chatId: telegramId,
      text: input.text,
      ...(input.buttonText
        ? {
            replyMarkup: {
              inline_keyboard: [
                [{ text: input.buttonText, web_app: { url: buildWebAppDeepLink(input.path, input.lang) } }],
              ],
            },
          }
        : {}),
    });
    return true;
  } catch (error) {
    console.error('[notify] soft-fail:', error);
    return false;
  }
}

export function toNotifyLang(language: string | null | undefined): 'ru' | 'en' {
  return (language ?? '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
