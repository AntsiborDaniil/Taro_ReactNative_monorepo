import { config } from './config';

export type LatestPaymentReturn = {
  returnPath: string | null;
  spreadCredits: number | null;
};

/** Internal API: путь возврата после оплаты + баланс для telegram_id. */
export async function fetchLatestPaymentReturn(
  telegramId: number,
): Promise<LatestPaymentReturn | null> {
  const url = new URL(
    `${config.apiPublicUrl}/api/internal/payments/latest-return`,
  );
  url.searchParams.set('telegramId', String(telegramId));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Support-Secret': config.botToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`latest-return ${response.status}: ${text}`);
  }

  const body = (await response.json()) as {
    returnPath?: string | null;
    spreadCredits?: number | null;
  };

  return {
    returnPath: body.returnPath ?? null,
    spreadCredits:
      typeof body.spreadCredits === 'number' ? body.spreadCredits : null,
  };
}
