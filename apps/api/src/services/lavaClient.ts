import {
  getLavaApiBaseUrl,
  getLavaApiKey,
  getLavaOfferId,
  getTelegramBotUsername,
  getWebAppUrl,
} from '../lib/env';

export type LavaCreateInvoiceResult = {
  id: string;
  paymentUrl: string;
  status?: string;
};

type LavaInvoiceResponse = {
  id?: string;
  paymentUrl?: string | null;
  status?: string;
  error?: string;
  details?: unknown;
};

/** Prefer Telegram bot deep-links; fall back to web app query params. */
function httpsReturnUrls(): {
  successful_return_url?: string;
  failure_return_url?: string;
  cancel_return_url?: string;
} {
  const bot = getTelegramBotUsername();
  if (bot) {
    const base = `https://t.me/${bot}`;
    return {
      successful_return_url: `${base}?start=lava_success`,
      failure_return_url: `${base}?start=lava_failed`,
      cancel_return_url: `${base}?start=lava_cancelled`,
    };
  }

  const web = getWebAppUrl();
  if (!web || !web.startsWith('https://')) {
    return {};
  }
  const base = web.replace(/\/$/, '');
  return {
    successful_return_url: `${base}/?lava=success`,
    failure_return_url: `${base}/?lava=failed`,
    cancel_return_url: `${base}/?lava=cancelled`,
  };
}

export async function createLavaOneTimeInvoice(input: {
  email: string;
  userId: string;
}): Promise<LavaCreateInvoiceResult> {
  const apiKey = getLavaApiKey();
  const offerId = getLavaOfferId();
  if (!apiKey || !offerId) {
    throw new Error('LAVA_NOT_CONFIGURED');
  }

  const body = {
    email: input.email.trim().toLowerCase(),
    offerId,
    currency: 'RUB',
    periodicity: 'ONE_TIME',
    buyerLanguage: 'RU',
    clientUtm: {
      utm_source: 'mindful_web',
      utm_medium: 'spread_credits',
      utm_campaign: 'starter_plus3',
      utm_content: input.userId,
    },
    ...httpsReturnUrls(),
  };

  const response = await fetch(`${getLavaApiBaseUrl()}/api/v3/invoice`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as LavaInvoiceResponse;

  if (!response.ok) {
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : `Lava invoice failed (${response.status})`;
    const err = new Error(message) as Error & { status?: number; details?: unknown };
    err.status = response.status;
    err.details = payload.details ?? payload;
    throw err;
  }

  const id = payload.id?.trim();
  const paymentUrl = payload.paymentUrl?.trim();
  if (!id || !paymentUrl) {
    throw new Error('LAVA_INVOICE_INCOMPLETE');
  }

  return {
    id,
    paymentUrl,
    status: payload.status,
  };
}
