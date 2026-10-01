import { baseApi } from '@shared/api/baseApi';
import type { TarotDailyQuota } from '@entities/user/model/types';
import type { TSpread } from '@legacy-data';
import type { TarotSpreadInput } from './model/getAIRequestBody';
import {
  cloudRecordToSpread,
  spreadToCloudBody,
  type CloudSpreadRecord,
} from './model/cloudMapping';

export type InterpretResponse = {
  interpretation: string;
  tarotDaily?: TarotDailyQuota;
  spreadCredits?: number;
};

export type InterpretErrorBody = {
  code?: string;
  message?: string;
  tarotDaily?: TarotDailyQuota;
  spreadCredits?: number;
};

/**
 * POST /api/interpret — требует авторизацию (401 без сессии, см.
 * apps/api/src/routes/interpret.ts) и тратит дневной лимит/кредит расклада
 * (429 code:'daily_limit_reached' с телом tarotDaily/spreadCredits).
 * invalidatesTags:['User'] — после успеха/лимита обновляем /api/auth/me
 * (бейдж зарядов в Header берёт квоту из userSlice).
 */
export const spreadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    interpretSpread: build.mutation<InterpretResponse, TarotSpreadInput>({
      query: (body) => ({ url: '/api/interpret', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    /** GET /api/spreads?limit&offset — история (пункт 1), требует сессию. */
    listSpreadsHistory: build.query<TSpread[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => `/api/spreads?limit=${limit}&offset=${offset}`,
      transformResponse: (response: { spreads: CloudSpreadRecord[] }) =>
        response.spreads.map(cloudRecordToSpread),
      providesTags: ['Spreads'],
    }),
    /** POST /api/spreads — сохранить новый расклад в облачную историю (пункт 2). */
    createSpreadHistory: build.mutation<TSpread, TSpread>({
      query: (spread) => ({ url: '/api/spreads', method: 'POST', body: spreadToCloudBody(spread) }),
      transformResponse: (response: { spread: CloudSpreadRecord }) => cloudRecordToSpread(response.spread),
      invalidatesTags: ['Spreads'],
    }),
    /** PATCH /api/spreads/:id — обновить уже сохранённый (напр. досчитанное толкование). */
    updateSpreadHistory: build.mutation<TSpread, { uid: string; spread: TSpread }>({
      query: ({ uid, spread }) => ({
        url: `/api/spreads/${uid}`,
        method: 'PATCH',
        body: {
          interpretation: spread.interpretation ?? null,
          question: spread.question ?? null,
          payload: spreadToCloudBody(spread).payload,
        },
      }),
      transformResponse: (response: { spread: CloudSpreadRecord }) => cloudRecordToSpread(response.spread),
      invalidatesTags: ['Spreads'],
    }),
    /** GET /api/spreads/shared/:id — публичная шаренная интерпретация (пункт 3), без авторизации. */
    getSharedSpread: build.query<TSpread, string>({
      query: (uid) => `/api/spreads/shared/${encodeURIComponent(uid)}`,
      transformResponse: (response: { spread: CloudSpreadRecord }) => cloudRecordToSpread(response.spread),
    }),
  }),
});

export const {
  useInterpretSpreadMutation,
  useListSpreadsHistoryQuery,
  useCreateSpreadHistoryMutation,
  useUpdateSpreadHistoryMutation,
  useLazyGetSharedSpreadQuery,
} = spreadApi;
