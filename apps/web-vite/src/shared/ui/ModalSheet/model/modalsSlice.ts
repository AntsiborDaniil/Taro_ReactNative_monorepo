import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ModalStackItem = {
  id: string;
  props?: Record<string, unknown>;
};

export type ModalsState = {
  stack: ModalStackItem[];
};

const initialState: ModalsState = {
  stack: [],
};

const modalsSlice = createSlice({
  name: 'modals',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<{ id: string; props?: Record<string, unknown> }>) => {
      state.stack.push({ id: action.payload.id, props: action.payload.props });
    },
    closeModal: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload == null) {
        state.stack.pop();
        return;
      }
      const index = state.stack.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        state.stack.splice(index, 1);
      }
    },
    closeAllModals: (state) => {
      state.stack = [];
    },
  },
});

export const { openModal, closeModal, closeAllModals } = modalsSlice.actions;
export const modalsReducer = modalsSlice.reducer;
