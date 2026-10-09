import { baseApi } from '@shared/api/baseApi';
import type { CreatePairBody, CreatePairResponse, PairCardDto, PairQuota, PairView } from './model/types';

type PairEnvelope = { pair: PairView };
const unwrap = (response: PairEnvelope): PairView => response.pair;

export const pairApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Есть ли у автора бесплатная пара; заодно сервер лениво возвращает ⚡ за истёкшие приглашения. */
    getPairQuota: build.query<PairQuota, void>({
      query: () => '/api/pairs/quota',
      providesTags: ['PairQuota'],
    }),
    createPair: build.mutation<CreatePairResponse, CreatePairBody>({
      query: (body) => ({ url: '/api/pairs', method: 'POST', body }),
      // User — заряды в бейдже; PairQuota — первая пара уже использована.
      invalidatesTags: ['User', 'PairQuota', 'FreeFirsts'],
    }),
    getPair: build.query<PairView, string>({
      query: (id) => `/api/pairs/${encodeURIComponent(id)}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, id) => [{ type: 'Pairs', id }],
    }),
    /** Партнёр занимает слот приглашения (тело `{}` — сервер ждёт JSON). */
    joinPair: build.mutation<PairView, string>({
      query: (id) => ({ url: `/api/pairs/${encodeURIComponent(id)}/join`, method: 'POST', body: {} }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, id) => [{ type: 'Pairs', id }],
    }),
    submitPairCards: build.mutation<PairView, { id: string; cards: PairCardDto[] }>({
      query: ({ id, cards }) => ({
        url: `/api/pairs/${encodeURIComponent(id)}/cards`,
        method: 'POST',
        body: { cards },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Pairs', id }],
    }),
    consentPair: build.mutation<PairView, { id: string; share: boolean; language: string }>({
      query: ({ id, share, language }) => ({
        url: `/api/pairs/${encodeURIComponent(id)}/consent`,
        method: 'POST',
        body: { share, language },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Pairs', id }],
    }),
    revokePair: build.mutation<PairView, string>({
      query: (id) => ({ url: `/api/pairs/${encodeURIComponent(id)}/revoke`, method: 'POST', body: {} }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, id) => [{ type: 'Pairs', id }, 'PairQuota', 'FreeFirsts'],
    }),
  }),
});

export const {
  useGetPairQuotaQuery,
  useCreatePairMutation,
  useGetPairQuery,
  useJoinPairMutation,
  useSubmitPairCardsMutation,
  useConsentPairMutation,
  useRevokePairMutation,
} = pairApi;
