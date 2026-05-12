export const TAROT_AUTH_CHANGED_EVENT = 'tarot-auth-changed';

export function emitTarotAuthChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(TAROT_AUTH_CHANGED_EVENT));
}
