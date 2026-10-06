import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { spreadApi } from '@entities/spread/api';
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

function applyQuota(
  state: UserState,
  payload: { tarotDaily?: TarotDailyQuota | null; spreadCredits?: number },
): void {
  if (payload.tarotDaily !== undefined && payload.tarotDaily !== null) {
    state.tarotDaily = payload.tarotDaily;
  }
  if (typeof payload.spreadCredits === 'number' && Number.isFinite(payload.spreadCredits)) {
    state.spreadCredits = Math.max(0, Math.floor(payload.spreadCredits));
  }
}

function authStatus(payload: unknown): number | string | undefined {
  if (payload && typeof payload === 'object' && 'status' in payload) {
    return (payload as { status?: number | string }).status;
  }
  return undefined;
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Локально обновить квоту (бейдж), если /me ещё не успел/упал. */
    setTarotAccess(
      state,
      action: PayloadAction<{ tarotDaily?: TarotDailyQuota | null; spreadCredits?: number }>,
    ) {
      applyQuota(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(userApi.endpoints.authMe.matchPending, (state) => {
        // Фонный refetch (invalidate User) не должен блокировать толкование и гасить UI.
        if (!state.isAuthenticated) {
          state.sessionLoading = true;
        }
      })
      .addMatcher(userApi.endpoints.authMe.matchFulfilled, (state, action) => {
        state.sessionLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tarotDaily = action.payload.tarotDaily ?? null;
        state.spreadCredits = action.payload.spreadCredits ?? 0;
      })
      .addMatcher(userApi.endpoints.authMe.matchRejected, (state, action) => {
        state.sessionLoading = false;
        if (action.meta.condition) {
          return;
        }
        const status = authStatus(action.payload);
        // Только явный «не авторизован» сбрасывает сессию. Сеть/5xx — оставляем квоту в бейдже.
        if (status === 401 || status === 403) {
          state.isAuthenticated = false;
          state.user = null;
          state.tarotDaily = null;
          state.spreadCredits = 0;
        }
      })
      .addMatcher(spreadApi.endpoints.interpretSpread.matchFulfilled, (state, action) => {
        applyQuota(state, action.payload);
      })
      .addMatcher(spreadApi.endpoints.followUpSpread.matchFulfilled, (state, action) => {
        applyQuota(state, action.payload);
      })
      .addMatcher(spreadApi.endpoints.interpretSpread.matchRejected, (state, action) => {
        const data = action.payload && typeof action.payload === 'object' && 'data' in action.payload
          ? (action.payload as { data?: { tarotDaily?: TarotDailyQuota; spreadCredits?: number } }).data
          : undefined;
        if (data) applyQuota(state, data);
      })
      .addMatcher(spreadApi.endpoints.followUpSpread.matchRejected, (state, action) => {
        const data = action.payload && typeof action.payload === 'object' && 'data' in action.payload
          ? (action.payload as { data?: { tarotDaily?: TarotDailyQuota; spreadCredits?: number } }).data
          : undefined;
        if (data) applyQuota(state, data);
      });
  },
});

export const { setTarotAccess } = userSlice.actions;
export const userReducer = userSlice.reducer;
