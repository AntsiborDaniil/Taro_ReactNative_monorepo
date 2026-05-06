import { Platform } from 'react-native';

const DEFAULT_TAROT_AI_BASE_URL = 'https://tarot-api.ru';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Если страница открыта как localhost, а в env указан 127.0.0.1 (или наоборот),
 * браузер считает это разными сайтами — SameSite=Lax cookie не уходит на fetch.
 * На web подставляем hostname страницы для loopback API.
 */
function alignLoopbackHostnameWithPage(baseUrl: string): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return baseUrl;
  }
  try {
    const pageHost = window.location.hostname;
    const u = new URL(baseUrl);
    const apiLoopback =
      u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    const pageLoopback =
      pageHost === 'localhost' || pageHost === '127.0.0.1';
    if (apiLoopback && pageLoopback && u.hostname !== pageHost) {
      u.hostname = pageHost;
      return normalizeBaseUrl(u.origin);
    }
  } catch {
    /* ignore */
  }
  return baseUrl;
}

/**
 * Базовый URL API; на web при каждом вызове учитывает hostname вкладки (cookie/CORS).
 */
export function getTarotAiApiBaseUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_TAROT_API_BASE_URL?.trim() ||
    DEFAULT_TAROT_AI_BASE_URL;
  return alignLoopbackHostnameWithPage(normalizeBaseUrl(raw));
}
