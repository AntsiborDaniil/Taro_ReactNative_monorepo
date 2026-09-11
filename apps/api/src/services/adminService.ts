import { getSupabaseAdmin } from '../lib/supabase';
import { filterString, isSupervisorRole } from '../lib/adminAuth';
import { getTelegramBotToken } from '../lib/env';

const USER_SORT = new Set([
  'created_at',
  'email',
  'name',
  'role',
  'spread_credits',
  'telegram_id',
]);
const SPREAD_SORT = new Set([
  'created_at',
  'updated_at',
  'category',
  'spread_key',
  'name',
  'cards_count',
]);
const TICKET_SORT = new Set(['created_at', 'updated_at', 'status', 'telegram_id']);
const PAYMENT_SORT = new Set(['created_at', 'paid_at', 'status', 'credits']);

export type AdminListResult<T> = {
  rows: T[];
  total: number;
};

function sortField(requested: string, allowed: Set<string>, fallback: string): string {
  return allowed.has(requested) ? requested : fallback;
}

function sanitizeSearch(value: string): string {
  return value.replace(/[,()%\\]/g, ' ').trim().slice(0, 80);
}

export async function adminGetProfileRole(userId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return data?.role ?? null;
}

export async function listAdminUsers(input: {
  start: number;
  end: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: Record<string, unknown>;
}): Promise<AdminListResult<Record<string, unknown>>> {
  const admin = getSupabaseAdmin();
  const q = sanitizeSearch(filterString(input.filter, 'q'));
  const role = filterString(input.filter, 'role');
  const hasCredits = input.filter.hasCredits;

  let query = admin.from('profiles').select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }
  if (hasCredits === true || hasCredits === 'true') {
    query = query.gt('spread_credits', 0);
  }
  if (hasCredits === false || hasCredits === 'false') {
    query = query.eq('spread_credits', 0);
  }
  if (q) {
    if (/^\d+$/.test(q)) {
      query = query.or(
        `email.ilike.%${q}%,name.ilike.%${q}%,telegram_id.eq.${q}`
      );
    } else if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
    ) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,id.eq.${q}`);
    } else {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }
  }

  const field = sortField(input.sortField, USER_SORT, 'created_at');
  const { data, error, count } = await query
    .order(field, { ascending: input.sortOrder === 'asc' })
    .range(input.start, input.end);

  if (error) {
    throw error;
  }

  return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
}

export async function getAdminUser(id: string): Promise<Record<string, unknown> | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  let spreadsCount = 0;
  let dailyUsed = 0;
  let dailyDay: string | null = null;

  try {
    const { count } = await admin
      .from('spreads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id);
    spreadsCount = count ?? 0;
  } catch {
    spreadsCount = 0;
  }

  try {
    const { data: daily, error: dailyError } = await admin
      .from('tarot_daily_usage')
      .select('count, day')
      .eq('user_id', id)
      .order('day', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!dailyError && daily) {
      dailyUsed = typeof daily.count === 'number' ? daily.count : 0;
      dailyDay = daily.day ?? null;
    }
  } catch {
    dailyUsed = 0;
    dailyDay = null;
  }

  return {
    ...data,
    spreads_count: spreadsCount,
    daily_used: dailyUsed,
    daily_day: dailyDay,
  };
}

export async function updateAdminUser(
  actorRole: string,
  id: string,
  patch: {
    name?: string;
    role?: string;
    spread_credits?: number | string;

  }
): Promise<Record<string, unknown> | null> {
  const updates: Record<string, unknown> = {};
  if (typeof patch.name === 'string') {
    updates.name = patch.name.trim();
  }
  if (patch.spread_credits !== undefined && patch.spread_credits !== null) {
    const credits = Number(patch.spread_credits);
    if (Number.isFinite(credits)) {
      updates.spread_credits = Math.max(0, Math.floor(credits));
    }
  }
  if (typeof patch.role === 'string' && isSupervisorRole(actorRole)) {
    if (!['user', 'admin', 'supervisor'].includes(patch.role)) {
      const err = new Error('INVALID_ROLE');
      err.name = 'INVALID_ROLE';
      throw err;
    }
    updates.role = patch.role;
  }

  if (Object.keys(updates).length === 0) {
    return getAdminUser(id);
  }

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw error;
  }
  return getAdminUser(id);
}

export async function listAdminSpreads(input: {
  start: number;
  end: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: Record<string, unknown>;
}): Promise<AdminListResult<Record<string, unknown>>> {
  const admin = getSupabaseAdmin();
  const q = sanitizeSearch(filterString(input.filter, 'q'));
  const category = filterString(input.filter, 'category');
  const spreadKey = filterString(input.filter, 'spread_key');
  const userId = filterString(input.filter, 'user_id');

  let query = admin.from('spreads').select('*', { count: 'exact' });
  if (category) {
    query = query.eq('category', category);
  }
  if (spreadKey) {
    query = query.eq('spread_key', spreadKey);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,question.ilike.%${q}%,interpretation.ilike.%${q}%,spread_key.ilike.%${q}%`
    );
  }

  const field = sortField(input.sortField, SPREAD_SORT, 'created_at');
  const { data, error, count } = await query
    .order(field, { ascending: input.sortOrder === 'asc' })
    .range(input.start, input.end);

  if (error) {
    throw error;
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
}

export async function getAdminSpread(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('spreads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Record<string, unknown> | null;
}

export async function updateAdminSpread(
  id: string,
  patch: {
    question?: string | null;
    interpretation?: string | null;
    name?: string;
  }
): Promise<Record<string, unknown> | null> {
  const updates: Record<string, unknown> = {};
  if (patch.question !== undefined) {
    updates.question = patch.question;
  }
  if (patch.interpretation !== undefined) {
    updates.interpretation = patch.interpretation;
  }
  if (typeof patch.name === 'string') {
    updates.name = patch.name;
  }
  const { data, error } = await getSupabaseAdmin()
    .from('spreads')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Record<string, unknown> | null;
}

export async function deleteAdminSpread(id: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin().from('spreads').delete().eq('id', id);
  if (error) {
    throw error;
  }
  return true;
}

export async function listAdminTickets(input: {
  start: number;
  end: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: Record<string, unknown>;
}): Promise<AdminListResult<Record<string, unknown>>> {
  const admin = getSupabaseAdmin();
  const q = sanitizeSearch(filterString(input.filter, 'q'));
  const status = filterString(input.filter, 'status');
  const telegramId = filterString(input.filter, 'telegram_id');
  const userId = filterString(input.filter, 'user_id');

  let query = admin.from('support_tickets').select('*', { count: 'exact' });
  if (status) {
    query = query.eq('status', status);
  }
  if (telegramId) {
    query = query.eq('telegram_id', Number(telegramId));
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (q) {
    query = query.or(
      `message.ilike.%${q}%,username.ilike.%${q}%,display_name.ilike.%${q}%,admin_reply.ilike.%${q}%`
    );
  }

  const field = sortField(input.sortField, TICKET_SORT, 'created_at');
  const { data, error, count } = await query
    .order(field, { ascending: input.sortOrder === 'asc' })
    .range(input.start, input.end);

  if (error) {
    throw error;
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
}

export async function getAdminTicket(id: string): Promise<Record<string, unknown> | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  let profile: Record<string, unknown> | null = null;
  if (data.user_id) {
    const { data: userRow } = await admin
      .from('profiles')
      .select('id, email, name, telegram_id, spread_credits, role, created_at')
      .eq('id', data.user_id)
      .maybeSingle();
    profile = userRow as Record<string, unknown> | null;
  } else if (data.telegram_id) {
    const { data: userRow } = await admin
      .from('profiles')
      .select('id, email, name, telegram_id, spread_credits, role, created_at')
      .eq('telegram_id', data.telegram_id)
      .maybeSingle();
    profile = userRow as Record<string, unknown> | null;
  }

  return {
    ...data,
    profile,
    profile_email: profile?.email ?? null,
    profile_name: profile?.name ?? null,
    profile_role: profile?.role ?? null,
    profile_credits: profile?.spread_credits ?? null,
  };
}

export async function createSupportTicket(input: {
  telegramId: number;
  username?: string | null;
  displayName?: string | null;
  message: string;
}): Promise<{ id: string }> {
  const admin = getSupabaseAdmin();
  const text = input.message.trim();
  if (!text) {
    throw new Error('EMPTY_MESSAGE');
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('telegram_id', input.telegramId)
    .maybeSingle();

  const { data, error } = await admin
    .from('support_tickets')
    .insert({
      telegram_id: input.telegramId,
      user_id: profile?.id ?? null,
      username: input.username ?? null,
      display_name: input.displayName ?? null,
      message: text,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? new Error('TICKET_CREATE_FAILED');
  }
  return { id: data.id };
}

export async function replyAdminTicket(
  id: string,
  replyText: string,
  status?: string
): Promise<Record<string, unknown> | null> {
  const text = replyText.trim();
  if (!text) {
    throw new Error('EMPTY_REPLY');
  }

  const ticket = await getAdminTicket(id);
  if (!ticket) {
    return null;
  }

  const nextStatus =
    status && ['open', 'answered', 'closed'].includes(status)
      ? status
      : 'answered';

  const { data, error } = await getSupabaseAdmin()
    .from('support_tickets')
    .update({
      admin_reply: text,
      status: nextStatus,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  const telegramId = Number(ticket.telegram_id);
  const previousReply =
    typeof ticket.admin_reply === 'string' ? ticket.admin_reply.trim() : '';
  if (
    Number.isFinite(telegramId) &&
    telegramId > 0 &&
    text !== previousReply
  ) {
    try {
      await sendTelegramMessage(
        telegramId,
        `Ответ поддержки Mindful Tarot:\n\n${text}`
      );
    } catch (error) {
      console.error('[admin] telegram reply failed:', error);
    }
  }

  return data as Record<string, unknown> | null;
}

export async function updateAdminTicketStatus(
  id: string,
  status: string
): Promise<Record<string, unknown> | null> {
  if (!['open', 'answered', 'closed'].includes(status)) {
    throw new Error('INVALID_STATUS');
  }
  const { data, error } = await getSupabaseAdmin()
    .from('support_tickets')
    .update({ status })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Record<string, unknown> | null;
}

export async function listAdminPayments(input: {
  start: number;
  end: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: Record<string, unknown>;
}): Promise<AdminListResult<Record<string, unknown>>> {
  const admin = getSupabaseAdmin();
  const status = filterString(input.filter, 'status');
  const userId = filterString(input.filter, 'user_id');
  const q = sanitizeSearch(filterString(input.filter, 'q'));

  let query = admin.from('lava_checkouts').select('*', { count: 'exact' });
  if (status) {
    query = query.eq('status', status);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (q) {
    query = query.or(`invoice_id.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const field = sortField(input.sortField, PAYMENT_SORT, 'created_at');
  const { data, error, count } = await query
    .order(field, { ascending: input.sortOrder === 'asc' })
    .range(input.start, input.end);

  if (error) {
    throw error;
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
}

export async function getAdminPayment(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('lava_checkouts')
    .select('*')
    .eq('invoice_id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Record<string, unknown> | null;
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = getTelegramBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TELEGRAM_SEND_FAILED: ${response.status} ${body}`);
  }
}
