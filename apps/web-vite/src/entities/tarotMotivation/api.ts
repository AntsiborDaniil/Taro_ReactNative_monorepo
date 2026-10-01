import { baseApi } from '@shared/api/baseApi';
import type { TarotDailyQuota } from '@entities/user/model/types';
import type { MotivationKey } from './model/types';

export type GenerateMotivationBody = {
  language: string;
  card: { card: string; direction: string };
  params?: Record<string, unknown>;
};

export type GenerateMotivationResponse = {
  interpretation: string;
  tarotDaily?: TarotDailyQuota;
  spreadCredits?: number;
};

export type GenerateMotivationErrorBody = {
  code?: string;
  message?: string;
  tarotDaily?: TarotDailyQuota;
  spreadCredits?: number;
};

/**
 * Перенос useMotivation().getAIMotivation на RTK Query — POST /api/motivation/:key
 * (1-в-1 getTarotAiApiBaseUrl() на web: тот же origin, значит тот же baseApi).
 * Тратит дневной лимит/кредит как /api/interpret (429 code:'daily_limit_reached'),
 * поэтому invalidatesTags:['User'] — обновляем квоту в бейдже после списания.
 */
export const motivationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    generateMotivation: build.mutation<GenerateMotivationResponse, { key: MotivationKey; body: GenerateMotivationBody }>({
      query: ({ key, body }) => ({ url: `/api/motivation/${key}`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGenerateMotivationMutation } = motivationApi;
