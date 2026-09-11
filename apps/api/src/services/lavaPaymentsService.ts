import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';
import { getLavaCreditsPerPurchase } from '../lib/env';
import { createLavaOneTimeInvoice } from './lavaClient';

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
}): Promise<{ paymentUrl: string; invoiceId: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidCheckoutEmail(email)) {
    throw new Error('INVALID_EMAIL');
  }

  const invoice = await createLavaOneTimeInvoice({
    email,
    userId: input.userId,
  });

  const credits = getLavaCreditsPerPurchase();

  if (useMemoryBackend()) {
    memory.memoryCreateLavaCheckout({
      invoiceId: invoice.id,
      userId: input.userId,
      credits,
      email,
    });
    return { paymentUrl: invoice.paymentUrl, invoiceId: invoice.id };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('lava_checkouts').insert({
    invoice_id: invoice.id,
    user_id: input.userId,
    credits,
    email,
    status: 'pending',
  });

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
  const credits = getLavaCreditsPerPurchase();

  if (useMemoryBackend()) {
    const result = memory.memoryFulfillLavaCheckout({
      invoiceId,
      userId: utmUserId,
      credits,
      email,
    });
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
    .select('user_id, status')
    .eq('invoice_id', invoiceId)
    .maybeSingle();

  const userId = (checkout?.user_id as string | undefined) || utmUserId;
  if (!userId) {
    throw new Error('UNKNOWN_BUYER');
  }

  const { data, error } = await admin.rpc('add_spread_credits_for_invoice', {
    p_invoice_id: invoiceId,
    p_user_id: userId,
    p_credits: credits,
    p_email: email,
    p_raw: payload,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    handled: true,
    spreadCredits:
      typeof row?.spread_credits === 'number' ? row.spread_credits : undefined,
    alreadyApplied: Boolean(row?.already_applied),
  };
}
