import { Linking, Platform } from 'react-native';
import InAppReview from 'react-native-in-app-review';
import {
  AsyncMemoryKey,
  AsyncMemoryRateAppKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';

const IOS_APP_ID = '6749576474';
const ANDROID_PACKAGE = 'com.melexp.tarotmobile';

// 90 дней
const COOLDOWN = 90 * 24 * 60 * 60 * 1000;

const FINISHED_SPREADS_FOR_RATE_APP = 3;

export async function rateApp() {
  const canRequest = InAppReview.isAvailable();
  let shown = false;

  if (canRequest) {
    try {
      shown = await InAppReview.RequestInAppReview();
    } catch {
      // DO-NOTHING
    }
  }

  if (!shown) {
    if (Platform.OS === 'ios') {
      const url = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
      Linking.openURL(url).catch(() => {});
    } else {
      const url = `market://details?id=${ANDROID_PACKAGE}`;
      Linking.openURL(url).catch(() => {});
    }
  }
}

export async function rateAppWithCooldown(): Promise<void> {
  const rateAppData: Partial<Record<AsyncMemoryRateAppKey, string>> =
    (await getValueForAsyncDeviceMemoryKey<
      Record<AsyncMemoryRateAppKey, string>
    >(AsyncMemoryKey.RateApp)) ?? {};

  try {
    const lastRateAppTry = Number(
      rateAppData[AsyncMemoryRateAppKey.LastRateAppTry] ?? 0
    );

    const now = Date.now();

    if (!lastRateAppTry || now - lastRateAppTry >= COOLDOWN) {
      rateApp().catch(() => {});

      await saveAsyncDeviceMemoryKey<
        Partial<Record<AsyncMemoryRateAppKey, string>>
      >(AsyncMemoryKey.RateApp, {
        ...rateAppData,
        [AsyncMemoryRateAppKey.LastRateAppTry]: String(now),
      });
    }
  } catch {
    // DO-NOTHING
  }
}

export async function rateAppAfterFinishedSpreads(): Promise<void> {
  const rateAppData: Partial<Record<AsyncMemoryRateAppKey, string>> =
    (await getValueForAsyncDeviceMemoryKey<
      Record<AsyncMemoryRateAppKey, string>
    >(AsyncMemoryKey.RateApp)) ?? {};

  if (rateAppData[AsyncMemoryRateAppKey.RateAfterSpreadsAsked]) {
    return;
  }

  try {
    const nextFinishedSpreadsValue =
      Number(rateAppData[AsyncMemoryRateAppKey.FinishedSpreadsCount] ?? 0) + 1;

    if (nextFinishedSpreadsValue === FINISHED_SPREADS_FOR_RATE_APP) {
      await saveAsyncDeviceMemoryKey<
        Partial<Record<AsyncMemoryRateAppKey, string>>
      >(AsyncMemoryKey.RateApp, {
        ...rateAppData,
        [AsyncMemoryRateAppKey.RateAfterSpreadsAsked]: '1',
      });

      await rateAppWithCooldown();
    } else {
      await saveAsyncDeviceMemoryKey<
        Partial<Record<AsyncMemoryRateAppKey, string>>
      >(AsyncMemoryKey.RateApp, {
        ...rateAppData,
        [AsyncMemoryRateAppKey.FinishedSpreadsCount]: String(
          nextFinishedSpreadsValue
        ),
      });
    }
  } catch {
    // DO-NOTHING
  }
}
