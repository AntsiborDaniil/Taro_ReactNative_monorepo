import { getSupabaseAdmin } from '../lib/supabase';
import { useMemoryBackend } from '../lib/devMode';
import { ACQUISITION_SOURCE_LABELS,
  type AcquisitionSource,
  ACQUISITION_SOURCES,
  isAcquisitionSource,
} from '../lib/acquisitionSources';

export type RecordAcquisitionInput = {
  telegramId: number;
  source: AcquisitionSource;
  username?: string | null;
  displayName?: string | null;
};

export type RecordAcquisitionResult = {
  telegramId: number;
  source: AcquisitionSource;
  isNew: boolean;
  profileUpdated: boolean;
};

const memoryLeads = new Map<
  number,
  {
    source: AcquisitionSource;
    createdAt: string;
    updatedAt: string;
    username: string | null;
    displayName: string | null;
  }
>();

/** Лиды memory-бэкенда (для админки в dev). */
export function listMemoryLeads() {
  return [...memoryLeads.entries()].map(([telegramId, lead]) => ({
    telegram_id: telegramId,
    username: lead.username,
    display_name: lead.displayName,
    source: lead.source,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  }));
}

export async function recordTelegramAcquisition(
  input: RecordAcquisitionInput
): Promise<RecordAcquisitionResult> {
  const source = input.source;
  if (!isAcquisitionSource(source)) {
    throw new Error('INVALID_SOURCE');
  }

  if (useMemoryBackend()) {
    const existing = memoryLeads.get(input.telegramId);
    if (existing) {
      existing.username = input.username ?? null;
      existing.displayName = input.displayName ?? null;
      existing.updatedAt = new Date().toISOString();
      return {
        telegramId: input.telegramId,
        source: existing.source,
        isNew: false,
        profileUpdated: false,
      };
    }
    const nowIso = new Date().toISOString();
    memoryLeads.set(input.telegramId, {
      source,
      createdAt: nowIso,
      updatedAt: nowIso,
      username: input.username ?? null,
      displayName: input.displayName ?? null,
    });
    return {
      telegramId: input.telegramId,
      source,
      isNew: true,
      profileUpdated: false,
    };
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from('telegram_acquisition')
    .select('telegram_id, source')
    .eq('telegram_id', input.telegramId)
    .maybeSingle();

  let isNew = false;
  let finalSource: AcquisitionSource = source;

  if (existing?.source && isAcquisitionSource(existing.source)) {
    finalSource = existing.source;
    await admin
      .from('telegram_acquisition')
      .update({
        username: input.username ?? null,
        display_name: input.displayName ?? null,
        updated_at: now,
      })
      .eq('telegram_id', input.telegramId);
  } else {
    isNew = true;
    const { error } = await admin.from('telegram_acquisition').upsert(
      {
        telegram_id: input.telegramId,
        source,
        username: input.username ?? null,
        display_name: input.displayName ?? null,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'telegram_id' }
    );
    if (error) {
      throw error;
    }
    finalSource = source;
  }

  let profileUpdated = false;
  const { data: profile } = await admin
    .from('profiles')
    .select('id, acquisition_source')
    .eq('telegram_id', input.telegramId)
    .maybeSingle();

  if (profile?.id && !profile.acquisition_source) {
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        acquisition_source: finalSource,
        acquisition_at: now,
      })
      .eq('id', profile.id)
      .is('acquisition_source', null);
    profileUpdated = !profileError;
  }

  return {
    telegramId: input.telegramId,
    source: finalSource,
    isNew,
    profileUpdated,
  };
}

/** Copy first-touch source onto profile when user signs in via Telegram. */
export async function applyAcquisitionToProfile(input: {
  userId: string;
  telegramId: number;
}): Promise<void> {
  if (useMemoryBackend()) {
    const lead = memoryLeads.get(input.telegramId);
    if (!lead) {
      return;
    }
    return;
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, acquisition_source')
    .eq('id', input.userId)
    .maybeSingle();

  if (!profile || profile.acquisition_source) {
    return;
  }

  const { data: lead } = await admin
    .from('telegram_acquisition')
    .select('source, created_at')
    .eq('telegram_id', input.telegramId)
    .maybeSingle();

  if (!lead?.source || !isAcquisitionSource(lead.source)) {
    return;
  }

  await admin
    .from('profiles')
    .update({
      acquisition_source: lead.source,
      acquisition_at: lead.created_at ?? new Date().toISOString(),
    })
    .eq('id', input.userId)
    .is('acquisition_source', null);
}

/** Итоги воронки: пользователи в приложении, лиды бота, лиды с профилем. */
export async function getAcquisitionTotals(): Promise<{
  usersTotal: number;
  leadsTotal: number;
  leadsWithApp: number;
}> {
  if (useMemoryBackend()) {
    return { usersTotal: 0, leadsTotal: memoryLeads.size, leadsWithApp: 0 };
  }
  const admin = getSupabaseAdmin();
  const [users, leads] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('telegram_acquisition')
      .select('telegram_id', { count: 'exact', head: true }),
  ]);
  if (users.error) throw users.error;
  if (leads.error) throw leads.error;

  // Лиды с профилем: пересечение telegram_id пачками (без миграции/RPC).
  let leadsWithApp = 0;
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('telegram_acquisition')
      .select('telegram_id')
      .order('telegram_id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const ids = (data ?? []).map((row) => row.telegram_id);
    if (ids.length) {
      const { count, error: profError } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('telegram_id', ids);
      if (profError) throw profError;
      leadsWithApp += count ?? 0;
    }
    if (ids.length < PAGE) break;
  }

  return {
    usersTotal: users.count ?? 0,
    leadsTotal: leads.count ?? 0,
    leadsWithApp,
  };
}

export async function getAcquisitionSummary(): Promise<
  Array<{ source: string; label: string; count: number }>
> {
  const labels: Record<string, string> = ACQUISITION_SOURCE_LABELS;

  if (useMemoryBackend()) {
    const counts = new Map<string, number>();
    for (const lead of memoryLeads.values()) {
      counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
    }
    return ACQUISITION_SOURCES.map((source) => ({
      source,
      label: labels[source] ?? source,
      count: counts.get(source) ?? 0,
    }));
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('telegram_acquisition')
    .select('source');

  if (error) {
    throw error;
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const source = String(row.source ?? '');
    if (!source) continue;
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  const known = ACQUISITION_SOURCES.map((source) => ({
    source,
    label: labels[source] ?? source,
    count: counts.get(source) ?? 0,
  }));

  const extras = [...counts.entries()]
    .filter(([source]) => !isAcquisitionSource(source))
    .map(([source, count]) => ({
      source,
      label: source,
      count,
    }));

  return [...known, ...extras];
}
