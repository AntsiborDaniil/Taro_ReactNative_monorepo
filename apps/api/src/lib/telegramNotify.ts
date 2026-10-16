import { getTelegramBotToken, getWebAppUrl } from './env';

export type TelegramInlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>>;
};

/** Ошибка Bot API: статус, описание и retry_after (для 429) сохранены для классификации. */
export class TelegramSendError extends Error {
  constructor(
    readonly status: number,
    readonly description: string,
    readonly retryAfterSec?: number,
  ) {
    super(`TELEGRAM_SEND_FAILED: ${status} ${description}`);
    this.name = 'TelegramSendError';
  }
}

const TELEGRAM_SEND_TIMEOUT_MS = 15_000;

/** Отправка сообщения ботом. parse_mode HTML опционально; reply_markup — inline keyboard. */
export async function sendTelegramMessage(input: {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: TelegramInlineKeyboard;
}): Promise<void> {
  const token = getTelegramBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TELEGRAM_SEND_TIMEOUT_MS),
    body: JSON.stringify({
      chat_id: input.chatId,
      text: input.text,
      ...(input.parseMode ? { parse_mode: input.parseMode } : {}),
      ...(input.replyMarkup ? { reply_markup: input.replyMarkup } : {}),
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    let retryAfter: number | undefined;
    try {
      const parsed = JSON.parse(body) as { parameters?: { retry_after?: number } };
      retryAfter = parsed.parameters?.retry_after;
    } catch {
      // не JSON — описание остаётся сырым телом
    }
    throw new TelegramSendError(response.status, body, retryAfter);
  }
}

/** Базовый WEB_APP_URL из env (со слешем в конце или без). */
export function resolveWebAppBaseUrl(): string {
  const raw = getWebAppUrl()?.trim() || 'https://taro-react-native-monorepo-web-vite.vercel.app/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/**
 * Склеивает WEB_APP_URL + returnPath (?lang=).
 * returnPath — только относительный путь приложения (/spreads, /settings…).
 */
export function buildWebAppDeepLink(returnPath: string | null | undefined, lang?: 'ru' | 'en'): string {
  const base = resolveWebAppBaseUrl();
  const url = new URL(base);
  const path = sanitizeReturnPath(returnPath) || '/';
  const [pathnamePart, search = ''] = path.split('?');
  url.pathname = pathnamePart || '/';
  if (search) {
    const extra = new URLSearchParams(search);
    extra.forEach((v, k) => url.searchParams.set(k, v));
  }
  if (lang) {
    url.searchParams.set('lang', lang);
  }
  return url.toString();
}

/** Разрешаем только внутренние пути Mini App. */
export function sanitizeReturnPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('://') || /[\s<>"']/.test(trimmed)) return null;
  if (trimmed.length > 200) return null;
  return trimmed;
}
