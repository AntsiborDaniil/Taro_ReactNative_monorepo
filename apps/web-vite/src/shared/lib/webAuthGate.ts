/**
 * Перенос 1-в-1 apps/web/src/shared/lib/web/webAuthGate.ts (без Platform.OS —
 * тут всегда web) — гейт перед началом расклада/интерпретацией. `/api/interpret`
 * на бэке требует авторизацию (401 без сессии, см. apps/api/src/routes/interpret.ts),
 * поэтому гость не может получить AI-толкование без входа.
 */

/** Сессия `/me` разрешилась и пользователь не авторизован. */
export function isWebGuestSession(isAuthenticated: boolean, sessionLoading: boolean): boolean {
  return sessionLoading !== true && !isAuthenticated;
}

/** `/me` (и тихий логин) ещё не завершился. */
export function isWebAuthPending(sessionLoading: boolean): boolean {
  return sessionLoading === true;
}

/** Показывать модалку/тост входа только после того, как `/me` отработал. */
export function shouldPromptWebSignIn(isAuthenticated: boolean, sessionLoading: boolean): boolean {
  return isWebGuestSession(isAuthenticated, sessionLoading);
}
