import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';
import {
  DEFAULT_CREDIT_PACK,
  findCreditPack,
  getPackOfferId,
  packCredits,
} from '../lib/creditPacks';
import { sanitizeReturnPath } from '../lib/telegramNotify';
import { createLavaOneTimeInvoice } from './lavaClient';
import { notifyLavaPaymentSuccess } from './paymentNotifyService';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YANDEX_EMAIL_RE =
  /^[a-z0-9._%+-]+@(yandex\.(ru|com|by|kz|ua)|ya\.ru)$/i;

export function isValidCheckoutEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return EMAIL_RE.test(normalized) && YANDEX_EMAIL_RE.test(normalized);
}

export async function createLavaCheckoutForUser(input: {
  userId: string;
  email: string;
  returnPath?: string | null;
  packId?: string | null;
}): Promise<{ paymentUrl: string; invoiceId: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidCheckoutEmail(email)) {
    throw new Error('INVALID_EMAIL');
  }

  const pack = findCreditPack(input.packId ?? DEFAULT_CREDIT_PACK);
  const offerId = pack ? getPackOfferId(pack) : undefined;
  if (!pack || !offerId) {
    throw new Error('PACK_UNAVAILABLE');
  }

  const returnPath = sanitizeReturnPath(input.returnPath);

  const invoice = await createLavaOneTimeInvoice({
    email,
    userId: input.userId,
    offerId,
    packId: pack.id,
  });

  // Сколько начислить — фиксируем в checkout: вебхук берёт число отсюда, а не из конфига.
  const credits = packCredits(pack);

  if (useMemoryBackend()) {
    memory.memoryCreateLavaCheckout({
      invoiceId: invoice.id,
      userId: input.userId,
      credits,
      email,
      returnPath,
    });
    return { paymentUrl: invoice.paymentUrl, invoiceId: invoice.id };
  }

  const admin = getSupabaseAdmin();
  const row = {
    invoice_id: invoice.id,
    user_id: input.userId,
    credits,
    email,
    status: 'pending' as const,
    return_path: returnPath,
  };

  let { error } = await admin.from('lava_checkouts').insert(row);

  // Миграция ещё не применена: колонки return_path нет — сохраняем checkout без неё.
  if (
    error &&
    (error.code === 'PGRST204' ||
      /return_path/i.test(error.message || '') ||
      /schema cache/i.test(error.message || ''))
  ) {
    console.warn(
      '[lava] return_path unavailable in DB, inserting checkout without it:',
      error.message
    );
    const { return_path: _omit, ...withoutPath } = row;
    ({ error } = await admin.from('lava_checkouts').insert(withoutPath));
  }

  if (error) {
    throw error;
  }

  return { paymentUrl: invoice.paymentUrl, invoiceId: invoice.id };
}

export type LavaWebhookPayload = {
  eventType?: string;
  event_type?: string;
  contractId?: string;
  buyer?: { email?: string };
  clientUtm?: {
    utm_content?: string | null;
    utm_source?: string | null;
  };
  status?: string;
  [key: string]: unknown;
};

function readEventType(payload: LavaWebhookPayload): string {
  return String(payload.eventType || payload.event_type || '')
    .trim()
    .toLowerCase();
}

/** Soft-fail: ошибка notify не должна ронять webhook. */
async function tryNotifyAfterPayment(input: {
  userId: string;
  creditsAdded: number;
  spreadCredits?: number;
  returnPath?: string | null;
}): Promise<void> {
  try {
    let telegramId: number | null = null;

    if (useMemoryBackend()) {
      telegramId = memory.memoryGetTelegramId(input.userId);
    } else {
      const admin = getSupabaseAdmin();
      const { data: profile } = await admin
        .from('profiles')
        .select('telegram_id')
        .eq('id', input.userId)
        .maybeSingle();
      const raw = profile?.telegram_id;
      if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
        telegramId = raw;
      } else if (typeof raw === 'string' && /^\d+$/.test(raw)) {
        telegramId = Number(raw);
      }
    }

    if (!telegramId || input.spreadCredits == null) {
      return;
    }

    await notifyLavaPaymentSuccess({
      telegramId,
      creditsAdded: input.creditsAdded,
      spreadCredits: input.spreadCredits,
      returnPath: input.returnPath,
    });
  } catch (error) {
    console.error('[lava] payment telegram notify failed', error);
  }
}

export async function fulfillLavaPaymentSuccess(
  payload: LavaWebhookPayload
): Promise<{ handled: boolean; spreadCredits?: number; alreadyApplied?: boolean }> {
  const eventType = readEventType(payload);
  if (eventType && eventType !== 'payment.success') {
    return { handled: false };
  }

  const invoiceId = String(payload.contractId || '').trim();
  if (!invoiceId) {
    throw new Error('MISSING_CONTRACT_ID');
  }

  const utmUserId = payload.clientUtm?.utm_content?.trim() || null;
  const email = payload.buyer?.email?.trim().toLowerCase() || '';
  // Запасной вариант, если checkout не найден (пакет +3 по умолчанию).
  const fallbackPack = findCreditPack(DEFAULT_CREDIT_PACK);
  const credits = fallbackPack ? packCredits(fallbackPack) : 3;

  if (useMemoryBackend()) {
    const result = memory.memoryFulfillLavaCheckout({
      invoiceId,
      userId: utmUserId,
      credits,
      email,
    });
    if (!result.alreadyApplied) {
      await tryNotifyAfterPayment({
        userId: result.userId,
        creditsAdded: result.creditsAdded,
        spreadCredits: result.spreadCredits,
        returnPath: result.returnPath,
      });
    }
    return {
      handled: true,
      spreadCredits: result.spreadCredits,
      alreadyApplied: result.alreadyApplied,
    };
  }

  const admin = getSupabaseAdmin();

  // Prefer user from pending checkout; fall back to utm_content
  const { data: checkout } = await admin
    .from('lava_checkouts')
    .select('user_id, status, return_path, credits')
    .eq('invoice_id', invoiceId)
    .maybeSingle();

  const userId = (checkout?.user_id as string | undefined) || utmUserId;
  if (!userId) {
    throw new Error('UNKNOWN_BUYER');
  }

  const creditsAdded =
    typeof checkout?.credits === 'number' && checkout.credits > 0
      ? checkout.credits
      : credits;

  const { data, error } = await admin.rpc('add_spread_credits_for_invoice', {
    p_invoice_id: invoiceId,
    p_user_id: userId,
    // Число зарядов купленного пакета (из checkout), а не константа.
    p_credits: creditsAdded,
    p_email: email,
    p_raw: payload,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const alreadyApplied = Boolean(row?.already_applied);
  const spreadCredits =
    typeof row?.spread_credits === 'number' ? row.spread_credits : undefined;

  if (!alreadyApplied) {
    await tryNotifyAfterPayment({
      userId,
      creditsAdded,
      spreadCredits,
      returnPath: sanitizeReturnPath(checkout?.return_path),
    });
  }

  return {
    handled: true,
    spreadCredits,
    alreadyApplied,
  };
}

/** Для бота: последний paid checkout + баланс по telegram_id. */
export async function getLatestPaidReturnForTelegram(
  telegramId: number
): Promise<{ returnPath: string | null; spreadCredits: number } | null> {
  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    return null;
  }

  if (useMemoryBackend()) {
    return memory.memoryGetLatestPaidReturnForTelegram(telegramId);
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, spread_credits')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (!profile?.id) {
    return null;
  }

  const { data: checkout } = await admin
    .from('lava_checkouts')
    .select('return_path')
    .eq('user_id', profile.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkout) {
    return null;
  }

  return {
    returnPath: sanitizeReturnPath(checkout.return_path),
    spreadCredits:
      typeof profile.spread_credits === 'number' ? profile.spread_credits : 0,
  };
}
