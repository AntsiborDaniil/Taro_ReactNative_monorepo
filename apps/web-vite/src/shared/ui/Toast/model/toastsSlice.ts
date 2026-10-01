import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'info' | 'success' | 'error';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

export type ToastsState = {
  items: ToastItem[];
};

const initialState: ToastsState = {
  items: [],
};

let nextId = 0;

const toastsSlice = createSlice({
  name: 'toasts',
  initialState,
  reducers: {
    showToast: {
      reducer: (state, action: PayloadAction<ToastItem>) => {
        state.items.push(action.payload);
      },
      prepare: (payload: { type: ToastType; message: string; duration?: number }) => ({
        payload: {
          id: `toast-${(nextId += 1)}`,
          type: payload.type,
          message: payload.message,
          duration: payload.duration ?? 3500,
        },
      }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastsSlice.actions;
export const toastsReducer = toastsSlice.reducer;
