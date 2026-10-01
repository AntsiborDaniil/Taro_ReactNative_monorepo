/** Языки бота / Mini App: только ru и en (как в web-vite). */
export type BotLang = 'ru' | 'en';

/**
 * Как в Mini App `languageFromTelegramCode`:
 * `ru*` → ru, всё остальное (в т.ч. en, de, …) → en.
 * Нет кода → ru (продукт по умолчанию на русском).
 */
export function resolveBotLang(languageCode?: string | null): BotLang {
  if (!languageCode) return 'ru';
  const base = languageCode.toLowerCase().split(/[-_]/)[0] ?? '';
  return base === 'ru' ? 'ru' : 'en';
}

/** WEB_APP_URL + `?lang=ru|en` — фронт читает и ставит язык до ручного выбора. */
export function webAppUrlWithLang(baseUrl: string, lang: BotLang): string {
  const url = new URL(baseUrl);
  url.searchParams.set('lang', lang);
  return url.toString();
}
