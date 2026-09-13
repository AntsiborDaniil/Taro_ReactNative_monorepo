import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

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

/** /me (and Telegram silent login) has not finished. */
export function isWebAuthPending(authSessionLoading?: boolean): boolean {
  return Platform.OS === 'web' && authSessionLoading === true;
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

/** No guest panels — toast only. Mini App should auto-login via Telegram. */
export function toastWebAuthRequired(message?: string): void {
  if (Platform.OS !== 'web') {
    return;
  }
  Toast.show({
    type: 'info',
    text1: message || 'Откройте приложение из Telegram-бота для входа',
  });
}
