import { AsyncMemorySettingKey } from 'shared/lib';
import { SoundField } from 'shared/types';

export type TSettingsFields = SoundField | 'deckStyle' | 'hasReversed';

export type TSettingsHookParameters = {
  asyncMemoryKey: AsyncMemorySettingKey;
  hasAutoSave?: boolean;
};

export type TSettingsHookResult = {
  handleChangeBase: <T>(value: T, name: TSettingsFields) => void;
};
