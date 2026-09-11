import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { fetchSharedCloudSpread } from 'shared/api/cloud';
import { useNativeNavigation } from 'shared/hooks';
import {
  clearIncomingSharedReadingFromUrl,
  readIncomingSharedReadingId,
} from 'shared/lib/web/sharedReadingLink';
import { NavigationRoute, TabRoute } from 'shared/types';
import type { TSpread } from 'shared/api';

type Options = {
  selectFullSpread?: (spread: TSpread) => void;
};

/**
 * Open a shared interpretation from Telegram startapp / ?reading= deep link.
 */
export function useSharedReadingDeepLink({ selectFullSpread }: Options): void {
  const navigation = useNativeNavigation();
  const { t } = useTranslation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || handledRef.current || !selectFullSpread) {
      return;
    }

    const readingId = readIncomingSharedReadingId();
    if (!readingId) {
      return;
    }

    handledRef.current = true;
    clearIncomingSharedReadingFromUrl();

    let cancelled = false;

    void (async () => {
      const shared = await fetchSharedCloudSpread(readingId);
      if (cancelled) {
        return;
      }

      if (!shared?.interpretation) {
        Toast.show({
          type: 'error',
          text1: t('core:ai.copy.shareOpenFailed'),
        });
        return;
      }

      selectFullSpread(shared);
      navigation.navigate(TabRoute.SpreadsTab, {
        screen: NavigationRoute.SpreadReadings,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigation, selectFullSpread, t]);
}
