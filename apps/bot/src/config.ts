import 'dotenv/config';

const DEFAULT_WEB_APP_URL = 'https://taro-react-native-monorepo.vercel.app/';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const config = {
  botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  webAppUrl: (process.env.WEB_APP_URL?.trim() || DEFAULT_WEB_APP_URL).replace(
    /\/?$/,
    '/'
  ),
} as const;
