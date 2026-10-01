import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS } from './constants';
import type { TSettings } from './types';

export type SettingsState = {
  settings: TSettings;
  loaded: boolean;
};

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  loaded: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<TSettings>) {
      state.settings = action.payload;
      state.loaded = true;
    },
  },
});

export const { setSettings } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
