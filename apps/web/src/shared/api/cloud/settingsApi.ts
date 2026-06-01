import { DEFAULT_SETTINGS } from 'shared/constants';
import { TSettings } from 'shared/types';
import { cloudFetch } from './cloudFetch';
import type { CloudSettingsResponse } from './types';

function normalizeSettings(raw: Record<string, unknown> | undefined): TSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  const sound = raw.sound as TSettings['sound'] | undefined;
  const appearance = raw.appearance as TSettings['appearance'] | undefined;
  const spread = raw.spread as TSettings['spread'] | undefined;

  return {
    sound: {
      vibration: sound?.vibration ?? DEFAULT_SETTINGS.sound!.vibration,
      notifications: sound?.notifications ?? DEFAULT_SETTINGS.sound!.notifications,
      moonNotifications:
        sound?.moonNotifications ?? DEFAULT_SETTINGS.sound!.moonNotifications,
    },
    appearance: {
      deckStyle:
        appearance?.deckStyle ?? DEFAULT_SETTINGS.appearance!.deckStyle,
    },
    spread: {
      hasReversed: spread?.hasReversed ?? DEFAULT_SETTINGS.spread!.hasReversed,
    },
  };
}

export async function fetchCloudSettings(): Promise<TSettings | null> {
  const result = await cloudFetch<CloudSettingsResponse>('/api/settings');
  if (!result.ok) {
    return null;
  }
  return normalizeSettings(result.data.settings);
}

export async function saveCloudSettings(settings: TSettings): Promise<boolean> {
  const result = await cloudFetch<CloudSettingsResponse>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
  return result.ok;
}

export async function patchCloudSettings(
  patch: Record<string, unknown>
): Promise<boolean> {
  const result = await cloudFetch<CloudSettingsResponse>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return result.ok;
}
