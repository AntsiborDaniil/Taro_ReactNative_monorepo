import { baseApi } from '@shared/api/baseApi';
import type { CreateGiftBody, CreateGiftResponse, GiftView } from './model/types';

export const giftApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createGift: build.mutation<CreateGiftResponse, CreateGiftBody>({
      query: (body) => ({ url: '/api/gifts', method: 'POST', body }),
      // User — заряды в бейдже (подарок стоит ⚡1).
      invalidatesTags: ['Gifts', 'User'],
    }),
    /** Публичный просмотр по ссылке — вход не нужен. */
    getGift: build.query<GiftView, string>({
      query: (id) => `/api/gifts/${encodeURIComponent(id)}`,
      transformResponse: (response: { gift: GiftView }) => response.gift,
      providesTags: (_result, _error, id) => [{ type: 'Gifts', id }],
    }),
    /** Получатель перевернул карту: сервер фиксирует первое открытие и уведомляет отправителя. */
    openGift: build.mutation<{ ok: boolean; firstOpen: boolean }, string>({
      query: (id) => ({ url: `/api/gifts/${encodeURIComponent(id)}/open`, method: 'POST', body: {} }),
    }),
  }),
});

export const { useCreateGiftMutation, useGetGiftQuery, useOpenGiftMutation } = giftApi;
