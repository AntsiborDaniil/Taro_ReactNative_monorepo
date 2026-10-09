import { baseApi } from '@shared/api/baseApi';

export type LavaCheckoutResponse = {
  paymentUrl: string;
  invoiceId?: string;
};

/** POST /api/payments/lava/checkout — см. apps/api/src/routes/lavaPayments.ts (требует авторизацию). */
export type CreditPackId = 'plus3' | 'plus9' | 'plus15';

export type CreditPack = {
  id: CreditPackId;
  credits: number;
  priceRub: number;
  badge?: 'popular' | 'best';
};

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/payments/lava/packs — пакеты с настроенным оффером Lava. */
    lavaPacks: build.query<CreditPack[], void>({
      query: () => ({ url: '/api/payments/lava/packs', method: 'GET' }),
      transformResponse: (response: { packs: CreditPack[] }) => response.packs ?? [],
    }),
    lavaCheckout: build.mutation<
      LavaCheckoutResponse,
      { email: string; returnPath?: string; pack?: CreditPackId }
    >({
      query: (body) => ({
        url: '/api/payments/lava/checkout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLavaCheckoutMutation, useLavaPacksQuery } = paymentsApi;
