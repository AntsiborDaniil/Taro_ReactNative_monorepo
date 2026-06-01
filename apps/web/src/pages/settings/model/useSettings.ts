import { useCallback } from 'react';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useData } from 'shared/DataProvider';
import { patchAppSettings } from 'shared/lib/cloudSettings/persistSettings';
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
          patchAppSettings({ [asyncMemoryKey]: newValue[asyncMemoryKey] }).catch(
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
