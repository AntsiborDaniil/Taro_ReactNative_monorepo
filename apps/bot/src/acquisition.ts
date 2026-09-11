import { config } from './config';

const TRACKED = new Set(['ig_bio', 'ig_stories', 'yt_shorts', 'other']);

export function isTrackedStartPayload(payload: string): boolean {
  return TRACKED.has(payload.trim().toLowerCase());
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
