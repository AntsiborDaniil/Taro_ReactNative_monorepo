import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { isTelegramLaunch, reauthTelegram } from './telegramReauth';

/**
 * В браузере baseUrl пустой: same-origin (dev-прокси /api -> :3002 и прод на Vercel),
 * cookie `tarot_session` без CORS. В Vitest у Node нет относительных URL, поэтому
 * origin фиксированный — его перехватывает MSW.
 * Заголовок повторяет apps/web/src/shared/api/tarotAiAuth.ts (authSignHeaders):
 * просим API не эхоить JWT в JSON, раз сессия и так уходит в HttpOnly cookie.
 */
const baseUrl = import.meta.env.VITEST ? 'http://127.0.0.1:3000' : '';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('X-Web-Cookie-Auth', '1');
    return headers;
  },
});

/** Ручки, которые сами создают/снимают сессию: их 401 — ответ по делу, а не «сессия выпала». */
const SESSION_ROUTES = /^\/api\/auth\/(telegram|signin|signup|verify-email|resend-verification|signout|dev\/)/;

function requestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

/**
 * Telegram Mini App: сессия могла выпасть (истёк токен, cookie не сохранилась, вход
 * при открытии не дошёл из-за холодного старта API). Любой 401 → тихий перевход по
 * initData и один повтор исходного запроса. Так проверка /api/auth/me при каждом
 * открытии (и при возврате в приложение — refetchOnFocus) сама восстанавливает вход.
 */
const baseQueryWithTelegramReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (
    result.error?.status === 401 &&
    !SESSION_ROUTES.test(requestUrl(args)) &&
    isTelegramLaunch() &&
    (await reauthTelegram())
  ) {
    result = await rawBaseQuery(args, api, extraOptions);
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithTelegramReauth,
  tagTypes: ['User', 'Favorites', 'Spreads', 'Settings', 'HabitWeek', 'Pairs', 'PairQuota', 'Gifts', 'FreeFirsts'],
  endpoints: () => ({}),
});
