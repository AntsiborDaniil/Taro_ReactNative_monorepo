import { baseApi } from '@shared/api/baseApi';
import { DEFAULT_SETTINGS } from './model/constants';
import type { TSettings } from './model/types';

/**
 * Перенос apps/web/src/shared/api/cloud/settingsApi.ts на RTK Query.
 * Требует сессию (см. apps/api/src/routes/settings.ts) — для гостя см.
 * entities/settings/model/local.ts.
 */
function normalizeSettings(raw: Record<string, unknown> | undefined): TSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const sound = raw.sound as TSettings['sound'] | undefined;
  const appearance = raw.appearance as TSettings['appearance'] | undefined;
  const spread = raw.spread as TSettings['spread'] | undefined;
  return {
    sound: {
      vibration: sound?.vibration ?? DEFAULT_SETTINGS.sound!.vibration,
      notifications: sound?.notifications ?? DEFAULT_SETTINGS.sound!.notifications,
      moonNotifications: sound?.moonNotifications ?? DEFAULT_SETTINGS.sound!.moonNotifications,
    },
    appearance: {
      deckStyle: appearance?.deckStyle ?? DEFAULT_SETTINGS.appearance!.deckStyle,
    },
    spread: {
      hasReversed: spread?.hasReversed ?? DEFAULT_SETTINGS.spread!.hasReversed,
    },
  };
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<TSettings, void>({
      query: () => '/api/settings',
      transformResponse: (response: { settings?: Record<string, unknown> }) =>
        normalizeSettings(response.settings),
      providesTags: ['Settings'],
    }),
    saveSettings: build.mutation<TSettings, TSettings>({
      query: (settings) => ({ url: '/api/settings', method: 'PUT', body: { settings } }),
      transformResponse: (response: { settings?: Record<string, unknown> }) =>
        normalizeSettings(response.settings),
      invalidatesTags: ['Settings'],
    }),
    patchSettings: build.mutation<TSettings, Partial<TSettings>>({
      query: (patch) => ({ url: '/api/settings', method: 'PATCH', body: patch }),
      transformResponse: (response: { settings?: Record<string, unknown> }) =>
        normalizeSettings(response.settings),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useSaveSettingsMutation, usePatchSettingsMutation } = settingsApi;
