import crypto from 'crypto';
import { getTelegramBotToken } from './env';
import { isTelegramDevBypass } from './devMode';

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

export type ValidatedTelegramWebAppData = {
  user: TelegramWebAppUser;
  authDate: number;
};

const MAX_AUTH_AGE_SEC = 24 * 60 * 60;

function buildDataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function parseUserFromParams(
  params: URLSearchParams
): ValidatedTelegramWebAppData | null {
  const authDate = Number(params.get('auth_date') || Date.now() / 1000);
  if (!Number.isFinite(authDate)) {
    return null;
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    return null;
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    return null;
  }

  if (!user?.id || typeof user.id !== 'number') {
    return null;
  }

  return { user, authDate };
}

/**
 * Dev-only: принять initData без HMAC (TELEGRAM_DEV_BYPASS=1),
 * либо минимальный fake user из пустой строки / query.
 */
function parseTelegramInitDataDev(
  initData: string
): ValidatedTelegramWebAppData | null {
  const trimmed = initData.trim();
  if (!trimmed || trimmed === 'dev') {
    return {
      user: { id: 100001, first_name: 'Dev', username: 'tarot_dev' },
      authDate: Math.floor(Date.now() / 1000),
    };
  }

  const params = new URLSearchParams(trimmed);
  params.delete('hash');
  const parsed = parseUserFromParams(params);
  if (parsed) {
    return parsed;
  }

  return {
    user: { id: 100001, first_name: 'Dev', username: 'tarot_dev' },
    authDate: Math.floor(Date.now() / 1000),
  };
}

export function validateTelegramWebAppInitData(
  initData: string
): ValidatedTelegramWebAppData | null {
  const trimmed = initData.trim();
  if (!trimmed) {
    return isTelegramDevBypass() ? parseTelegramInitDataDev(trimmed) : null;
  }

  if (isTelegramDevBypass()) {
    const params = new URLSearchParams(trimmed);
    const hash = params.get('hash');
    if (!hash) {
      return parseTelegramInitDataDev(trimmed);
    }
  }

  const params = new URLSearchParams(trimmed);
  const hash = params.get('hash');
  if (!hash) {
    return null;
  }

  params.delete('hash');

  let botToken: string;
  try {
    botToken = getTelegramBotToken();
  } catch {
    if (isTelegramDevBypass()) {
      return parseTelegramInitDataDev(trimmed);
    }
    return null;
  }

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(buildDataCheckString(params))
    .digest('hex');

  if (calculatedHash !== hash) {
    return isTelegramDevBypass() ? parseTelegramInitDataDev(trimmed) : null;
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) {
    return null;
  }

  const ageSec = Math.floor(Date.now() / 1000) - authDate;
  if (ageSec < 0 || ageSec > MAX_AUTH_AGE_SEC) {
    return null;
  }

  return parseUserFromParams(params);
}

export function telegramSyntheticEmail(telegramId: number): string {
  return `tg${telegramId}@telegram.mindful.app`;
}

export function telegramDisplayName(user: TelegramWebAppUser): string {
  const parts = [user.first_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  if (user.username?.trim()) {
    return user.username.trim();
  }
  return `Telegram ${user.id}`;
}

export function telegramUserPassword(telegramId: number): string {
  const pepper = process.env.TELEGRAM_AUTH_SECRET?.trim() || getTelegramBotToken();
  return crypto
    .createHmac('sha256', pepper)
    .update(`tg-user:${telegramId}`)
    .digest('base64url');
}
