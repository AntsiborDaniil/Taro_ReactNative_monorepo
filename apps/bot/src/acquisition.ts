import { config } from './config';

const TRACKED = new Set(['ig_bio', 'ig_stories', 'yt_shorts', 'tiktok', 'other']);

/** Служебные payload: не первый вход, лидом не считаем. */
const SERVICE_EXACT = new Set(['lava_success', 'lava_failed', 'lava_cancelled']);
const SERVICE_PREFIXES = ['r_', 'pair_', 'gift_'];

/**
 * Источник лида по payload /start: известная метка → она, служебный payload → null
 * (не записываем), пусто или неизвестное → 'direct'.
 */
export function resolveStartSource(payload: string): string | null {
  const normalized = payload.trim().toLowerCase();
  if (TRACKED.has(normalized)) {
    return normalized;
  }
  if (
    SERVICE_EXACT.has(normalized) ||
    SERVICE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  ) {
    return null;
  }
  return 'direct';
}

export function isTrackedStartPayload(payload: string): boolean {
  return resolveStartSource(payload) !== null;
}

export async function ingestAcquisition(input: {
  telegramId: number;
  source: string;
  username?: string;
  displayName?: string;
}): Promise<{ ok: boolean; isNew?: boolean }> {
  const response = await fetch(`${config.apiPublicUrl}/api/internal/acquisition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Support-Secret': config.botToken,
    },
    body: JSON.stringify({
      telegramId: input.telegramId,
      source: input.source,
      username: input.username ?? null,
      displayName: input.displayName ?? null,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`acquisition ingest ${response.status}: ${text}`);
  }

  const body = (await response.json()) as { isNew?: boolean };
  return { ok: true, isNew: body.isNew };
}
