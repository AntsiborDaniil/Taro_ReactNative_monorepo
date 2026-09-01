import 'dotenv/config';

const DEFAULT_WEB_APP_URL = 'https://taro-react-native-monorepo.vercel.app/';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535
    ? parsed
    : fallback;
}

export const config = {
  botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  webAppUrl: (process.env.WEB_APP_URL?.trim() || DEFAULT_WEB_APP_URL).replace(
    /\/?$/,
    '/'
  ),
  port: parsePort(process.env.PORT, 8080),
} as const;
