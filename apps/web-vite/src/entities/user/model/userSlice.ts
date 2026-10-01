import { createSlice } from '@reduxjs/toolkit';
import { userApi } from '../api';
import type { AuthSessionUser, TarotDailyQuota } from './types';

export type UserState = {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  sessionLoading: boolean;
  tarotDaily: TarotDailyQuota | null;
  spreadCredits: number;
};

const initialState: UserState = {
  isAuthenticated: false,
  user: null,
  sessionLoading: true,
  tarotDaily: null,
  spreadCredits: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(userApi.endpoints.authMe.matchPending, (state) => {
        state.sessionLoading = true;
      })
      .addMatcher(userApi.endpoints.authMe.matchFulfilled, (state, action) => {
        state.sessionLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tarotDaily = action.payload.tarotDaily ?? null;
        state.spreadCredits = action.payload.spreadCredits ?? 0;
      })
      .addMatcher(userApi.endpoints.authMe.matchRejected, (state) => {
        state.sessionLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.tarotDaily = null;
        state.spreadCredits = 0;
      });
  },
});

export const userReducer = userSlice.reducer;
