import { Platform, Share } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import type { TFunction } from 'i18next';
import Toast from 'react-native-toast-message';
import { AnalyticAction } from '../../types';

export const appStoreLinks = {
  ios: 'https://apps.apple.com/app/id6749576474',
  android:
    'https://play.google.com/store/apps/details?id=com.melexp.tarotmobile',
} as const;

export const shareApp = async (t?: TFunction<'translation', undefined>) => {
  if (Platform.OS === 'web') {
    const title = t?.('core:share.title') ?? '';
    const body =
      `${t?.('core:share.message.ios') ?? ''}\n\n${t?.('core:downloadAppStore')}: ${appStoreLinks.ios}\n${t?.('core:downloadGooglePlay')}: ${appStoreLinks.android}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: body });
        AppMetrica.reportEvent(AnalyticAction.ShareApp, { via: 'web-share-api' });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(body);
        Toast.show({
          type: 'success',
          text1: t?.('core:share.web.copied') ?? '',
        });
        AppMetrica.reportEvent(AnalyticAction.ShareApp, { via: 'clipboard' });
        return;
      }

      Toast.show({
        type: 'error',
        text1: t?.('core:share.web.fail') ?? '',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'AbortError' || message.includes('abort')) {
        AppMetrica.reportEvent(AnalyticAction.ShareAppCancel);
        return;
      }
      AppMetrica.reportError('Share app error (web)', message);
      Toast.show({
        type: 'error',
        text1: t?.('core:share.web.fail') ?? '',
      });
    }
    return;
  }

  try {
    const shareOptions = {
      message:
        (Platform.OS === 'ios'
          ? t?.('core:share.message.ios')
          : `${t?.('core:share.message.android')}: ${appStoreLinks.android}`) ?? '',
      url: Platform.OS === 'ios' ? appStoreLinks.ios : appStoreLinks.android,
      title: t?.('core:share.title') ?? '',
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      AppMetrica.reportEvent(AnalyticAction.ShareApp, {
        activityType: result.activityType,
      });
    } else if (result.action === Share.dismissedAction) {
      AppMetrica.reportEvent(AnalyticAction.ShareAppCancel);
    }
  } catch (error: any) {
    AppMetrica.reportError('Share app error', error.message);
  }
};
