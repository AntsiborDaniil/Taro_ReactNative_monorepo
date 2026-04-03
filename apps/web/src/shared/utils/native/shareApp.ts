import { Platform, Share } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import type { TFunction } from 'i18next';
import { AnalyticAction } from '../../types';

const appLink = {
  ios: 'https://apps.apple.com/app/id6749576474',
  android:
    'https://play.google.com/store/apps/details?id=com.melexp.tarotmobile',
};

export const shareApp = async (t?: TFunction<'translation', undefined>) => {
  try {
    const shareOptions = {
      message:
        (Platform.OS === 'ios'
          ? t?.('core:share.message.ios')
          : `${t?.('core:share.message.android')}: ${appLink.android}`) ?? '',
      url: Platform.OS === 'ios' ? appLink.ios : appLink.android,
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
