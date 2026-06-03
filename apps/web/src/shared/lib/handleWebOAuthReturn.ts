import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { navigationRef } from 'app/navigation/navigationRef';
import { emitTarotAuthChanged } from 'shared/lib/tarotAuthEvents';
import { NavigationRoute, TabRoute } from 'shared/types';

/** Opens Library → Account (личный кабинет). */
export function navigateToAuthAccount(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.navigate('TarotTabs', {
    screen: TabRoute.LibraryTab,
    params: {
      screen: NavigationRoute.Auth,
    },
  });
}

export type OAuthReturnResult = 'success' | 'error' | null;

/**
 * Reads ?auth= from URL after Google OAuth, cleans the query string,
 * refreshes session, and opens the account screen on success.
 */
export async function handleWebOAuthReturn(params: {
  loadSession: () => Promise<void>;
  tSuccess: string;
  tError: string;
}): Promise<OAuthReturnResult> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const search = new URLSearchParams(window.location.search);
  const authStatus = search.get('auth');
  if (!authStatus) {
    return null;
  }

  const authMessage = search.get('authMessage');
  search.delete('auth');
  search.delete('authMessage');
  const query = search.toString();
  const cleaned = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', cleaned);

  if (authStatus === 'success') {
    try {
      await params.loadSession();
      emitTarotAuthChanged();

      navigateToAuthAccount();
      setTimeout(navigateToAuthAccount, 100);

      Toast.show({
        type: 'success',
        text1: params.tSuccess,
      });
      return 'success';
    } catch {
      Toast.show({
        type: 'error',
        text1: params.tError,
      });
      return 'error';
    }
  }

  Toast.show({
    type: 'error',
    text1: authMessage || params.tError,
  });
  return 'error';
}
