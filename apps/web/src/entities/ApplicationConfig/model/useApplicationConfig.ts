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
import { AsyncMemoryKey, getValueForAsyncDeviceMemoryKey } from 'shared/lib';
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

  useEffect(() => {
    const getSettingsFromMemory = async () => {
      const savedSettings = await getValueForAsyncDeviceMemoryKey<TSettings>(
        AsyncMemoryKey.Settings
      );

      if (savedSettings) {
        setSettings(savedSettings);
      }
    };

    getSettingsFromMemory();
  }, []);

  return useMemo(
    () => ({
      setSettings,
      appearance: {
        deckStyle:
          settings?.appearance?.deckStyle ?? DeckStyle.RiderWaiteOriginal,
      },
      sound: settings?.sound,
      spread: settings?.spread,
      handleVibrationClick,
    }),
    [
      settings?.appearance?.deckStyle,
      settings?.sound,
      settings?.spread,
      handleVibrationClick,
    ]
  );
}
