import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Same-origin в dev (proxy /api -> :3002) и в проде — cookie-сессия
 * `tarot_session` работает без CORS. Заголовок повторяет
 * apps/web/src/shared/api/tarotAiAuth.ts (authSignHeaders): просим API не
 * эхоить JWT в JSON, раз сессия и так уходит в HttpOnly cookie.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('X-Web-Cookie-Auth', '1');
      return headers;
    },
  }),
  tagTypes: ['User', 'Favorites', 'Spreads', 'Settings'],
  endpoints: () => ({}),
});
