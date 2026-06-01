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

const MESSAGES_EN: Record<PasswordValidationCode, string> = {
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  PASSWORD_MISSING_UPPERCASE:
    'Password must include an uppercase Latin letter (A–Z)',
  PASSWORD_MISSING_LOWERCASE:
    'Password must include a lowercase Latin letter (a–z)',
  PASSWORD_MISSING_DIGIT: 'Password must include a digit (0–9)',
  PASSWORD_MISSING_SPECIAL:
    'Password must include a special character (!@#$…)',
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

export function getPasswordPolicyMessage(code: PasswordValidationCode): string {
  return MESSAGES_EN[code];
}

export function assertStrongPassword(password: string): void {
  const code = validateStrongPassword(password);
  if (code) {
    const error = new Error(code);
    error.name = 'WEAK_PASSWORD';
    throw error;
  }
}

export function weakPasswordResponse(code: PasswordValidationCode): {
  message: string;
  code: PasswordValidationCode;
} {
  return {
    message: getPasswordPolicyMessage(code),
    code,
  };
}
