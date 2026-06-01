import { Platform } from 'react-native';

/** Used when EXPO_PUBLIC_TAROT_API_BASE_URL is unset on Vercel (same-origin + proxy). */
const SAME_ORIGIN_ALIASES = new Set(['', '/', 'same-origin', 'relative']);

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Production (Vercel): leave EXPO_PUBLIC_TAROT_API_BASE_URL empty or `same-origin`
 * so requests go to /api/* on the same host (Vercel rewrites → BFF).
 */
function resolveConfiguredBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_TAROT_API_BASE_URL?.trim();
  if (raw === undefined || raw === null) {
    return null;
  }
  if (SAME_ORIGIN_ALIASES.has(raw)) {
    return null;
  }
  return normalizeBaseUrl(raw);
}

/**
 * Если страница открыта как localhost, а в env указан 127.0.0.1 (или наоборот),
 * браузер считает это разными сайтами — SameSite=Lax cookie не уходит на fetch.
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
 * Базовый URL API.
 * - Web + same-origin: текущий origin (Vercel proxy /api → BFF).
 * - Web + localhost: выравнивание hostname для cookie.
 * - Native: EXPO_PUBLIC_TAROT_API_BASE_URL обязателен.
 */
export function getTarotAiApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const configured = resolveConfiguredBaseUrl();
    if (!configured) {
      return normalizeBaseUrl(window.location.origin);
    }
    return alignLoopbackHostnameWithPage(configured);
  }

  const configured = resolveConfiguredBaseUrl();
  if (!configured) {
    throw new Error(
      'EXPO_PUBLIC_TAROT_API_BASE_URL is required for native builds'
    );
  }
  return configured;
}
