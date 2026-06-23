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
  const parsed = raw ? Number(raw) : 10;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function assertSupabaseEnv(): void {
  getSupabaseUrl();
  getSupabaseAnonKey();
  getSupabaseServiceRoleKey();
}

export function getTelegramBotToken(): string {
  return requireEnv('TELEGRAM_BOT_TOKEN');
}
