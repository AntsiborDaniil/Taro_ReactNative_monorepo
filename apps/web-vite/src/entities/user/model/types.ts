export type TarotDailyQuota = {
  used: number;
  limit: number;
  day: string;
};

export type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthMeSession = {
  user: AuthSessionUser;
  tarotDaily?: TarotDailyQuota | null;
  spreadCredits?: number;
};

/** Ошибка валидации пароля — см. apps/api/src/lib/passwordPolicy.ts (weakPasswordResponse). */
export type PasswordValidationCode =
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'PASSWORD_MISSING_UPPERCASE'
  | 'PASSWORD_MISSING_LOWERCASE'
  | 'PASSWORD_MISSING_DIGIT'
  | 'PASSWORD_MISSING_SPECIAL';

export type AuthApiError = {
  message?: string;
  code?: PasswordValidationCode;
  needsEmailVerification?: boolean;
  email?: string;
  devVerificationCode?: string;
};

export type AuthSignUpPayload = { name: string; email: string; password: string };
export type AuthSignInPayload = { email: string; password: string };

export type AuthSuccessResponse = { user: AuthSessionUser };
export type AuthPendingVerificationResponse = {
  needsEmailVerification: true;
  email: string;
  devVerificationCode?: string;
};
export type AuthSignResponse = AuthSuccessResponse | AuthPendingVerificationResponse;

export type VerifyEmailPayload = { email: string; code: string; password?: string; name?: string };
export type ResendVerificationPayload = { email: string };
export type ResendVerificationResponse = { devVerificationCode?: string };

export type UpdateProfilePayload = { name: string };
export type ChangePasswordPayload = { currentPassword: string; newPassword: string };
