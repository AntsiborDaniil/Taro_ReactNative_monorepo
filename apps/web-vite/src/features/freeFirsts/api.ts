import { baseApi } from '@shared/api/baseApi';

/** true — бесплатное «первый раз» ещё доступно. Сервер — источник истины. */
export type FreeFirsts = { deep: boolean; pair: boolean };

export const freeFirstsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFreeFirsts: build.query<FreeFirsts, void>({
      query: () => '/api/free-firsts',
      providesTags: ['FreeFirsts'],
    }),
  }),
});

export const { useGetFreeFirstsQuery } = freeFirstsApi;
