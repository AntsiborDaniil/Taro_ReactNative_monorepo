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

export function getTarotDailyLimit(): number {
  const raw = process.env.TAROT_DAILY_INTERPRET_LIMIT?.trim();
  const parsed = raw ? Number(raw) : 3;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
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

export function isLavaPaymentsConfigured(): boolean {
  return Boolean(getLavaApiKey() && getLavaOfferId() && getLavaWebhookSecret());
}
