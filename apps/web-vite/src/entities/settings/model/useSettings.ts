import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { haptic } from '@shared/lib/haptics';
import { useGetSettingsQuery, usePatchSettingsMutation } from '../api';
import { getLocalSettings, patchLocalSettings } from './local';
import { setSettings } from './settingsSlice';
import type { TSettings } from './types';

export type SettingsGroup = keyof TSettings;

/**
 * Перенос apps/web/src/entities/ApplicationConfig/model/useApplicationConfig.ts
 * + apps/web/src/pages/settings/model/useSettings.ts (handleChangeBase) в один
 * хук на RTK: авторизован → GET/PATCH /api/settings (settingsApi), гость →
 * localStorage (model/local.ts). Слайс `settings` — синхронный источник
 * текущих настроек для остального приложения (напр. reading: hasReversed).
 */
export function useSettings(): {
  settings: TSettings;
  loaded: boolean;
  updateSetting: <G extends SettingsGroup>(group: G, patch: Partial<NonNullable<TSettings[G]>>) => void;
  handleVibrationClick: () => void;
} {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const settings = useAppSelector((state) => state.settings.settings);
  const loaded = useAppSelector((state) => state.settings.loaded);

  const { data: cloudSettings } = useGetSettingsQuery(undefined, { skip: !isAuthenticated });
  const [patchSettings] = usePatchSettingsMutation();

  // Гость: читаем localStorage один раз на маунте (и когда логаутимся).
  useEffect(() => {
    if (isAuthenticated || sessionLoading) return;
    dispatch(setSettings(getLocalSettings()));
  }, [dispatch, isAuthenticated, sessionLoading]);

  // Авторизован: облако — источник истины, как только ответил /api/settings.
  useEffect(() => {
    if (!isAuthenticated || !cloudSettings) return;
    dispatch(setSettings(cloudSettings));
  }, [dispatch, isAuthenticated, cloudSettings]);

  const updateSetting = useCallback(
    <G extends SettingsGroup>(group: G, patch: Partial<NonNullable<TSettings[G]>>) => {
      const next: TSettings = {
        ...settings,
        [group]: { ...(settings[group] as object | undefined), ...patch },
      };
      dispatch(setSettings(next));

      if (isAuthenticated) {
        patchSettings({ [group]: next[group] } as Partial<TSettings>).catch(() => undefined);
        return;
      }
      patchLocalSettings({ [group]: next[group] } as Partial<TSettings>);
    },
    [dispatch, settings, isAuthenticated, patchSettings],
  );

  const vibrationOn = settings.sound?.vibration ?? true;
  const handleVibrationClick = useCallback(() => {
    if (!vibrationOn) return;
    // HapticFeedback в Mini App (iOS тоже), navigator.vibrate на вебе.
    haptic.impact('light');
  }, [vibrationOn]);

  return useMemo(
    () => ({ settings, loaded, updateSetting, handleVibrationClick }),
    [settings, loaded, updateSetting, handleVibrationClick],
  );
}
