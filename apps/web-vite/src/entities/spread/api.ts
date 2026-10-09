import { baseApi } from '@shared/api/baseApi';
import type { TarotDailyQuota } from '@entities/user/model/types';
import type { TSpread, TSpreadMemoryNote, TSpreadMemoryStats } from '@legacy-data';
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
  /** Детерминированный факт из истории раскладов (без LLM), если есть. */
  memoryNote?: TSpreadMemoryNote | null;
  memoryStats?: TSpreadMemoryStats | null;
};

export type InterpretErrorBody = {
  code?: string;
  message?: string;
  tarotDaily?: TarotDailyQuota;
  spreadCredits?: number;
};

export type FollowUpInput = TarotSpreadInput & {
  previous_interpretation: string;
  follow_up_question: string;
};

/**
 * POST /api/interpret — карта дня (spread_key simple_daySuggest) бесплатна, лимит 3/сутки
 * (429 code:'day_card_limit_reached'); mode:'deep' списывает 2 единицы. Требует авторизацию (401 без сессии, см.
 * apps/api/src/routes/interpret.ts) и тратит дневной лимит/кредит расклада
 * (429 code:'daily_limit_reached' с телом tarotDaily/spreadCredits).
 * invalidatesTags:['User'] — после успеха/лимита обновляем /api/auth/me
 * (бейдж зарядов в Header берёт квоту из userSlice).
 */
export type FreePeriodStatus = {
  kind: 'day' | 'week' | 'month';
  periodStart: string;
  available: boolean;
  /** UTC ISO — когда откроется следующая карта (00:00 по Москве). */
  nextAt: string;
  saved: { interpretation: string; card: { card_id?: string; card: string; direction: string } } | null;
};

export const spreadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Статус бесплатных карт дня/недели/месяца (GET /api/free-cards). */
    getFreeCards: build.query<FreePeriodStatus[], void>({
      query: () => ({ url: '/api/free-cards', method: 'GET' }),
      transformResponse: (response: { cards: FreePeriodStatus[] }) => response.cards,
      providesTags: ['Spreads'],
    }),
    interpretSpread: build.mutation<InterpretResponse, TarotSpreadInput>({
      query: (body) => ({ url: '/api/interpret', method: 'POST', body }),
      // Spreads — чтобы статус бесплатных карт периода обновился после открытия.
      // FreeFirsts — первый глубокий разбор бесплатный, после него метка пропадает.
      invalidatesTags: ['User', 'Spreads', 'FreeFirsts'],
    }),
    /** POST /api/interpret/follow-up — всегда 1 заряд (не дневной слот). */
    followUpSpread: build.mutation<InterpretResponse, FollowUpInput>({
      query: (body) => ({ url: '/api/interpret/follow-up', method: 'POST', body }),
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
  useFollowUpSpreadMutation,
  useListSpreadsHistoryQuery,
  useCreateSpreadHistoryMutation,
  useUpdateSpreadHistoryMutation,
  useLazyGetSharedSpreadQuery,
  useGetSharedSpreadQuery,
  useGetFreeCardsQuery,
} = spreadApi;
