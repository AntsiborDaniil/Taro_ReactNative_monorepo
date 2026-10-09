import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@shared/api/baseApi';
import { userReducer } from '@entities/user/model/userSlice';
import { settingsReducer } from '@entities/settings';
import { spreadReducer } from '@entities/spread';
import { habitsReducer } from '@entities/habits';
import { moodReducer } from '@entities/mood';
import { modalsReducer } from '@shared/ui/ModalSheet';
import { toastsReducer } from '@shared/ui/Toast';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    user: userReducer,
    settings: settingsReducer,
    spread: spreadReducer,
    habits: habitsReducer,
    mood: moodReducer,
    modals: modalsReducer,
    toasts: toastsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

// Включает refetchOnFocus / refetchOnReconnect у RTK Query (без этого флаги в AppShell не работают).
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
