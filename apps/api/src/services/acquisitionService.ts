import { getSupabaseAdmin } from '../lib/supabase';
import { useMemoryBackend } from '../lib/devMode';
import {
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
  { source: AcquisitionSource; createdAt: string }
>();

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
      return {
        telegramId: input.telegramId,
        source: existing.source,
        isNew: false,
        profileUpdated: false,
      };
    }
    memoryLeads.set(input.telegramId, {
      source,
      createdAt: new Date().toISOString(),
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

export async function getAcquisitionSummary(): Promise<
  Array<{ source: string; label: string; count: number }>
> {
  const labels: Record<string, string> = {
    ig_bio: 'Instagram bio',
    ig_stories: 'Instagram stories',
    yt_shorts: 'YouTube Shorts',
    other: 'Other',
  };

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
