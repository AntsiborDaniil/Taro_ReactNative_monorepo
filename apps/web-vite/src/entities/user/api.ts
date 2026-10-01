import { baseApi } from '@shared/api/baseApi';
import type {
  AuthMeSession,
  AuthSessionUser,
  AuthSignInPayload,
  AuthSignResponse,
  AuthSignUpPayload,
  ChangePasswordPayload,
  ResendVerificationPayload,
  ResendVerificationResponse,
  UpdateProfilePayload,
  VerifyEmailPayload,
} from './model/types';

/**
 * Перенос сетевых вызовов apps/web/src/pages/settings/ui/Auth/Auth.tsx (только
 * логика fetch — RN-разметка не переносилась) на RTK Query. Web всегда
 * cookie-based (authCredentials()==='include'), поэтому не нужны token/
 * AsyncStorage-ветки старого кода — baseApi.ts уже шлёт credentials:'include'
 * + X-Web-Cookie-Auth на каждый запрос.
 */
export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    authMe: build.query<AuthMeSession, void>({
      query: () => ({ url: '/api/auth/me', method: 'GET' }),
      providesTags: ['User'],
    }),
    signUp: build.mutation<AuthSignResponse, AuthSignUpPayload>({
      query: (body) => ({ url: '/api/auth/signup', method: 'POST', body }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
    signIn: build.mutation<AuthSignResponse, AuthSignInPayload>({
      query: (body) => ({ url: '/api/auth/signin', method: 'POST', body }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
    verifyEmail: build.mutation<{ user: AuthSessionUser }, VerifyEmailPayload>({
      query: (body) => ({ url: '/api/auth/verify-email', method: 'POST', body }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
    resendVerification: build.mutation<ResendVerificationResponse, ResendVerificationPayload>({
      query: (body) => ({ url: '/api/auth/resend-verification', method: 'POST', body }),
    }),
    updateProfile: build.mutation<{ user: AuthSessionUser }, UpdateProfilePayload>({
      query: (body) => ({ url: '/api/auth/profile', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: build.mutation<{ ok?: boolean }, ChangePasswordPayload>({
      query: (body) => ({ url: '/api/auth/password', method: 'PATCH', body }),
    }),
    signOut: build.mutation<void, void>({
      query: () => ({ url: '/api/auth/signout', method: 'POST' }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
    /**
     * POST /api/auth/telegram. С заголовком X-Web-Cookie-Auth API отдаёт только
     * { user } (cookie tarot_session), без JWT в JSON.
     */
    telegramAuth: build.mutation<{ user: AuthSessionUser }, { initData: string }>({
      query: (body) => ({ url: '/api/auth/telegram', method: 'POST', body }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
    /**
     * POST /api/auth/dev/quick-login. Тело обязательно `{}`: Fastify отвергает
     * пустой application/json. Ручка всегда кладёт token в JSON (memory-бэкенд).
     */
    devQuickLogin: build.mutation<
      { user: AuthSessionUser; token: string; refreshToken: string },
      void
    >({
      query: () => ({ url: '/api/auth/dev/quick-login', method: 'POST', body: {} }),
      invalidatesTags: ['User', 'Settings', 'Favorites', 'Spreads'],
    }),
  }),
});

export const {
  useAuthMeQuery,
  useLazyAuthMeQuery,
  useSignUpMutation,
  useSignInMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSignOutMutation,
  useTelegramAuthMutation,
  useDevQuickLoginMutation,
} = userApi;
