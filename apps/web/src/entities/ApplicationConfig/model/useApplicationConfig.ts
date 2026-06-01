import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { DeckStyle } from 'shared/api';
import { DEFAULT_SETTINGS } from 'shared/constants';
import { loadAppSettings } from 'shared/lib/cloudSettings/persistSettings';
import { TAROT_AUTH_CHANGED_EVENT } from 'shared/lib/tarotAuthEvents';
import { TAppearance, TSettings, TSound, TSpreadSettings } from 'shared/types';

export type TApplicationConfigHookResult = {
  setSettings: Dispatch<SetStateAction<TSettings>>;
  settings?: TSettings;
  appearance?: TAppearance;
  sound?: TSound;
  spread?: TSpreadSettings;
  handleVibrationClick: () => Promise<void>;
};

export function useApplicationConfig(): TApplicationConfigHookResult {
  const [settings, setSettings] = useState<TSettings>(DEFAULT_SETTINGS);

  const handleVibrationClick = useCallback(async () => {
    if (!settings.sound?.vibration) {
      return;
    }

    await impactAsync(ImpactFeedbackStyle.Light);
  }, [settings.sound?.vibration]);

  const reloadSettings = useCallback(async () => {
    const savedSettings = await loadAppSettings();
    setSettings(savedSettings);
  }, []);

  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onAuthChanged = () => {
      void reloadSettings();
    };

    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [reloadSettings]);

  return useMemo(
    () => ({
      setSettings,
      settings,
      appearance: {
        deckStyle:
          settings?.appearance?.deckStyle ?? DeckStyle.RiderWaiteOriginal,
      },
      sound: settings?.sound,
      spread: settings?.spread,
      handleVibrationClick,
    }),
    [
      settings,
      handleVibrationClick,
    ]
  );
}
