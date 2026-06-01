import { Platform } from 'react-native';
import { DEFAULT_SETTINGS } from 'shared/constants';
import {
  fetchCloudSettings,
  patchCloudSettings,
  saveCloudSettings,
} from 'shared/api/cloud';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import { TSettings } from 'shared/types';

async function loadLocalSettings(): Promise<TSettings | null> {
  return getValueForAsyncDeviceMemoryKey<TSettings>(AsyncMemoryKey.Settings);
}

export async function loadAppSettings(): Promise<TSettings> {
  if (Platform.OS === 'web') {
    const cloudSettings = await fetchCloudSettings();
    if (cloudSettings) {
      await saveAsyncDeviceMemoryKey(AsyncMemoryKey.Settings, cloudSettings);
      return cloudSettings;
    }
  }

  const localSettings = await loadLocalSettings();
  return localSettings ?? DEFAULT_SETTINGS;
}

export async function persistAppSettings(settings: TSettings): Promise<void> {
  await saveAsyncDeviceMemoryKey(AsyncMemoryKey.Settings, settings);

  if (Platform.OS === 'web') {
    await saveCloudSettings(settings);
  }
}

export async function patchAppSettings(patch: Partial<TSettings>): Promise<void> {
  const current = await loadAppSettings();
  const merged: TSettings = {
    sound: {
      vibration: patch.sound?.vibration ?? current.sound?.vibration ?? DEFAULT_SETTINGS.sound!.vibration,
      notifications:
        patch.sound?.notifications ??
        current.sound?.notifications ??
        DEFAULT_SETTINGS.sound!.notifications,
      moonNotifications:
        patch.sound?.moonNotifications ??
        current.sound?.moonNotifications ??
        DEFAULT_SETTINGS.sound!.moonNotifications,
    },
    appearance: {
      deckStyle:
        patch.appearance?.deckStyle ??
        current.appearance?.deckStyle ??
        DEFAULT_SETTINGS.appearance!.deckStyle,
    },
    spread: {
      hasReversed:
        patch.spread?.hasReversed ??
        current.spread?.hasReversed ??
        DEFAULT_SETTINGS.spread!.hasReversed,
    },
  };

  await saveAsyncDeviceMemoryKey(AsyncMemoryKey.Settings, merged);

  if (Platform.OS === 'web') {
    await patchCloudSettings(patch as Record<string, unknown>);
  }
}
