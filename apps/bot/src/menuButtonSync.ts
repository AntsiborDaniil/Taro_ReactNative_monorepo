import type { BotLang } from './lang';

/**
 * Язык, с которым для чата последний раз выставлена Menu Button (setChatMenuButton).
 * Только память процесса: после рестарта кнопку выставим заново при первом апдейте.
 * Размер ограничен — при переполнении вытесняем самую старую запись (порядок вставки Map).
 */
export const MENU_BUTTON_STORE_LIMIT = 50_000;
const appliedMenuLang = new Map<number, BotLang>();

/**
 * Нужно ли обновить Menu Button чата. true → запись уже помечена как применённая
 * (чтобы параллельные апдейты не слали дубли); при ошибке вызвать forgetMenuButtonLang.
 */
export function shouldSyncMenuButton(
  telegramId: number,
  lang: BotLang,
  store: Map<number, BotLang> = appliedMenuLang,
  limit: number = MENU_BUTTON_STORE_LIMIT,
): boolean {
  if (store.get(telegramId) === lang) return false;
  store.delete(telegramId); // переносим в конец порядка вытеснения
  store.set(telegramId, lang);
  while (store.size > limit) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
  return true;
}

/** Сбой setChatMenuButton → попробуем снова при следующем апдейте. */
export function forgetMenuButtonLang(
  telegramId: number,
  lang: BotLang,
  store: Map<number, BotLang> = appliedMenuLang,
): void {
  if (store.get(telegramId) === lang) store.delete(telegramId);
}
