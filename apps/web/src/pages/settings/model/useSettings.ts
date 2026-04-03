import { useCallback } from 'react';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useData } from 'shared/DataProvider';
import { AsyncMemoryKey, saveAsyncDeviceMemoryKey } from 'shared/lib';
import {
  TSettingsFields,
  TSettingsHookParameters,
  TSettingsHookResult,
} from './types';

export function useSettings({
  hasAutoSave = false,
  asyncMemoryKey,
}: TSettingsHookParameters): TSettingsHookResult {
  const { setSettings } = useData({
    Context: ApplicationConfigContext,
  });

  const handleChangeBase = useCallback(
    async <T = string>(value: T, name: TSettingsFields) => {
      setSettings?.((prevState) => {
        const currentSettings = prevState[asyncMemoryKey] || {};

        const newValue = {
          ...prevState,
          [asyncMemoryKey]: {
            ...currentSettings,
            [name]: value,
          },
        };

        if (hasAutoSave) {
          saveAsyncDeviceMemoryKey(AsyncMemoryKey.Settings, newValue).catch(
            console.error
          );
        }

        return newValue;
      });
    },
    [asyncMemoryKey, hasAutoSave, setSettings]
  );

  return {
    handleChangeBase,
  };
}
