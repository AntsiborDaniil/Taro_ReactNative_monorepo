const DEFAULT_TAROT_AI_BASE_URL = 'https://tarot-api.ru';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export const TAROT_AI_API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_TAROT_API_BASE_URL?.trim() ||
    DEFAULT_TAROT_AI_BASE_URL
);
