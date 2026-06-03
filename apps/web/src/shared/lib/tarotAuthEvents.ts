import type { AuthSessionUser } from 'entities/user/model/types';

export const TAROT_AUTH_CHANGED_EVENT = 'tarot-auth-changed';

export type TarotAuthChangedDetail = {
  /** When /me is not ready yet (cookie timing), keep global session from sign-in/verify response. */
  user?: AuthSessionUser;
};

export function emitTarotAuthChanged(user?: AuthSessionUser): void {
  if (typeof window === 'undefined') {
    return;
  }
  const detail: TarotAuthChangedDetail | undefined = user
    ? { user }
    : undefined;
  window.dispatchEvent(
    new CustomEvent<TarotAuthChangedDetail>(TAROT_AUTH_CHANGED_EVENT, {
      detail,
    })
  );
}
