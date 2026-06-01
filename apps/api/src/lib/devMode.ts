const PLACEHOLDER_KEY_MARKERS = ['your-anon-key', 'your-service-role-key', 'changeme'];

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

/** Явно: USE_MEMORY_BACKEND=1 | true */
export function isMemoryBackendForced(): boolean {
  const raw = env('USE_MEMORY_BACKEND')?.toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function hasPlaceholderSupabaseConfig(): boolean {
  const url = env('SUPABASE_URL');
  const anon = env('SUPABASE_ANON_KEY');
  const service = env('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !anon || !service) {
    return true;
  }

  if (PLACEHOLDER_KEY_MARKERS.some((m) => anon.includes(m) || service.includes(m))) {
    return true;
  }

  return false;
}

/**
 * In-memory auth + DB для локальной разработки без Supabase.
 * Включается по USE_MEMORY_BACKEND=1 или автоматически в development при placeholder/.env без ключей.
 */
export function useMemoryBackend(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return isMemoryBackendForced();
  }

  if (isMemoryBackendForced()) {
    return true;
  }

  if (env('USE_MEMORY_BACKEND')?.toLowerCase() === '0') {
    return false;
  }

  return hasPlaceholderSupabaseConfig();
}

/**
 * В memory backend по умолчанию регистрация сразу завершается (без шага с кодом).
 * DEV_AUTH_REQUIRE_EMAIL_VERIFY=1 — двухшаговый сценарий с OTP на экране.
 */
export function devAuthRequireEmailVerify(): boolean {
  const raw = env('DEV_AUTH_REQUIRE_EMAIL_VERIFY')?.toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function shouldLogAuthHttp(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.LOG_AUTH_HTTP === '1';
  }
  return env('LOG_AUTH_HTTP')?.toLowerCase() !== '0';
}

export function logBackendMode(): void {
  if (useMemoryBackend()) {
    console.warn(
      '[api] DEV memory backend — данные в RAM (перезапуск сервера сбрасывает). ' +
        'Для Supabase: задайте реальные SUPABASE_* и USE_MEMORY_BACKEND=0'
    );
    if (devAuthRequireEmailVerify()) {
      console.warn(
        '[api] DEV_AUTH_REQUIRE_EMAIL_VERIFY=1 — регистрация с кодом из «письма» (код в логе и в ответе API)'
      );
    } else {
      console.warn(
        '[api] Регистрация в dev: сразу вход (письмо только в логе [auth email]). Google — mock без OAuth.'
      );
    }
  }
}
