import { Platform } from 'react-native';

/** Web guest: session resolved and user is not signed in. */
export function isWebGuestSession(
  isAuthenticated?: boolean,
  authSessionLoading?: boolean
): boolean {
  return (
    Platform.OS === 'web' &&
    authSessionLoading !== true &&
    !isAuthenticated
  );
}

/** Show sign-in modal only after /me finished loading. */
export function shouldPromptWebSignIn(
  isAuthenticated?: boolean,
  authSessionLoading?: boolean
): boolean {
  return isWebGuestSession(isAuthenticated, authSessionLoading);
}

/** Web signed-in user after /me resolved. */
export function isWebAuthConfirmed(
  isAuthenticated?: boolean,
  authSessionLoading?: boolean
): boolean {
  return (
    Platform.OS === 'web' &&
    authSessionLoading !== true &&
    Boolean(isAuthenticated)
  );
}
