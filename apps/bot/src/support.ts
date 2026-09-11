import { config } from './config';

export async function ingestSupportTicket(input: {
  telegramId: number;
  username?: string;
  displayName?: string;
  message: string;
}): Promise<{ ok: boolean; id?: string }> {
  const response = await fetch(`${config.apiPublicUrl}/api/internal/support-tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Support-Secret': config.botToken,
    },
    body: JSON.stringify({
      telegramId: input.telegramId,
      username: input.username ?? null,
      displayName: input.displayName ?? null,
      message: input.message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`support ingest ${response.status}: ${text}`);
  }

  const body = (await response.json()) as { id?: string };
  return { ok: true, id: body.id };
}
