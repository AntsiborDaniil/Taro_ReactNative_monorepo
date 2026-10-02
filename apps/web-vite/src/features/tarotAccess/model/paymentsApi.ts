import { baseApi } from '@shared/api/baseApi';

export type LavaCheckoutResponse = {
  paymentUrl: string;
  invoiceId?: string;
};

/** POST /api/payments/lava/checkout — см. apps/api/src/routes/lavaPayments.ts (требует авторизацию). */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    lavaCheckout: build.mutation<
      LavaCheckoutResponse,
      { email: string; returnPath?: string }
    >({
      query: (body) => ({
        url: '/api/payments/lava/checkout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLavaCheckoutMutation } = paymentsApi;
