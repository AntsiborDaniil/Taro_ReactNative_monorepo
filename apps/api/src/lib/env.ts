import { useMemoryBackend } from './devMode';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv('SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return requireEnv('SUPABASE_ANON_KEY');
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim();
}

/**
 * Бесплатный дневной заряд: ровно 1. В 10:00 МСК (день слота, lib/tarotSlotDay.ts) он
 * снова становится 1, если был потрачен; неиспользованный не копится. Сутки считает
 * сервер, поэтому смена даты на устройстве лишних зарядов не даёт.
 * TAROT_DAILY_INTERPRET_LIMIT учитывается только на memory-бэкенде (pnpm dev:ui — обзор UI без лимита).
 */
export const FREE_DAILY_CHARGES = 1;

export function getTarotDailyLimit(): number {
  if (!useMemoryBackend()) return FREE_DAILY_CHARGES;
  const raw = process.env.TAROT_DAILY_INTERPRET_LIMIT?.trim();
  const parsed = raw ? Number(raw) : FREE_DAILY_CHARGES;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FREE_DAILY_CHARGES;
}

export function assertSupabaseEnv(): void {
  getSupabaseUrl();
  getSupabaseAnonKey();
  getSupabaseServiceRoleKey();
}

export function getTelegramBotToken(): string {
  return requireEnv('TELEGRAM_BOT_TOKEN');
}

export function getWebAppUrl(): string | undefined {
  const value = process.env.WEB_APP_URL?.trim();
  return value || undefined;
}

/** Bot @username without @ — used for Lava return URLs (t.me/<bot>?start=…). */
export function getTelegramBotUsername(): string {
  const raw =
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.TELEGRAM_BOT_NAME?.trim() ||
    'MindFullTaro_bot';
  return raw.replace(/^@/, '');
}

export function getLavaApiKey(): string | undefined {
  return process.env.LAVA_API_KEY?.trim() || undefined;
}

export function getLavaOfferId(): string | undefined {
  return process.env.LAVA_OFFER_ID?.trim() || undefined;
}

export function getLavaWebhookSecret(): string | undefined {
  return process.env.LAVA_WEBHOOK_SECRET?.trim() || undefined;
}

export function getLavaApiBaseUrl(): string {
  return (
    process.env.LAVA_API_BASE_URL?.trim() || 'https://gate.lava.top'
  ).replace(/\/$/, '');
}

export function getLavaCreditsPerPurchase(): number {
  const raw = process.env.LAVA_CREDITS_PER_PURCHASE?.trim();
  const parsed = raw ? Number(raw) : 3;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 3;
}

/** Хотя бы один пакет с оффером (CREDIT_PACKS), ключ и секрет вебхука. */
export function isLavaPaymentsConfigured(): boolean {
  const anyOffer = ['LAVA_OFFER_ID', 'LAVA_OFFER_ID_9', 'LAVA_OFFER_ID_15'].some((key) => process.env[key]?.trim());
  return Boolean(getLavaApiKey() && anyOffer && getLavaWebhookSecret());
}
