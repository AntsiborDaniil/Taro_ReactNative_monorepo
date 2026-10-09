import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * В браузере baseUrl пустой: same-origin (dev-прокси /api -> :3002 и прод на Vercel),
 * cookie `tarot_session` без CORS. В Vitest у Node нет относительных URL, поэтому
 * origin фиксированный — его перехватывает MSW.
 * Заголовок повторяет apps/web/src/shared/api/tarotAiAuth.ts (authSignHeaders):
 * просим API не эхоить JWT в JSON, раз сессия и так уходит в HttpOnly cookie.
 */
const baseUrl = import.meta.env.VITEST ? 'http://127.0.0.1:3000' : '';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('X-Web-Cookie-Auth', '1');
      return headers;
    },
  }),
  tagTypes: ['User', 'Favorites', 'Spreads', 'Settings', 'HabitWeek', 'Pairs', 'PairQuota', 'Gifts', 'FreeFirsts'],
  endpoints: () => ({}),
});
