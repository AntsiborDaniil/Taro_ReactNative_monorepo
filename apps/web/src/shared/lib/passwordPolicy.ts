export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export type PasswordValidationCode =
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'PASSWORD_MISSING_UPPERCASE'
  | 'PASSWORD_MISSING_LOWERCASE'
  | 'PASSWORD_MISSING_DIGIT'
  | 'PASSWORD_MISSING_SPECIAL';

const I18N_KEY_BY_CODE: Record<PasswordValidationCode, string> = {
  PASSWORD_TOO_SHORT: 'settings:auth.validation.passwordTooShort',
  PASSWORD_TOO_LONG: 'settings:auth.validation.passwordTooLong',
  PASSWORD_MISSING_UPPERCASE: 'settings:auth.validation.passwordNoUpper',
  PASSWORD_MISSING_LOWERCASE: 'settings:auth.validation.passwordNoLower',
  PASSWORD_MISSING_DIGIT: 'settings:auth.validation.passwordNoDigit',
  PASSWORD_MISSING_SPECIAL: 'settings:auth.validation.passwordNoSpecial',
};

export function validateStrongPassword(
  password: string
): PasswordValidationCode | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'PASSWORD_TOO_SHORT';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'PASSWORD_TOO_LONG';
  }
  if (!HAS_UPPERCASE.test(password)) {
    return 'PASSWORD_MISSING_UPPERCASE';
  }
  if (!HAS_LOWERCASE.test(password)) {
    return 'PASSWORD_MISSING_LOWERCASE';
  }
  if (!HAS_DIGIT.test(password)) {
    return 'PASSWORD_MISSING_DIGIT';
  }
  if (!HAS_SPECIAL.test(password)) {
    return 'PASSWORD_MISSING_SPECIAL';
  }
  return null;
}

export function passwordValidationCodeToI18nKey(
  code: PasswordValidationCode
): string {
  return I18N_KEY_BY_CODE[code];
}

export function validateStrongPasswordMessage(
  password: string,
  t: (key: string) => string
): true | string {
  const code = validateStrongPassword(password);
  if (!code) {
    return true;
  }
  return t(I18N_KEY_BY_CODE[code]);
}

export type StrongPasswordRulesOptions = {
  requiredMessage: string;
  t: (key: string) => string;
};

/** react-hook-form rules for signup / new password */
export function strongPasswordFormRules(options: StrongPasswordRulesOptions): {
  required: string | boolean;
  validate: (value: string) => true | string;
} {
  return {
    required: options.requiredMessage,
    validate: (value: string) =>
      validateStrongPasswordMessage(value, options.t),
  };
}
