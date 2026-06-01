import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';

export type UserSettingsRecord = {
  userId: string;
  settings: Record<string, unknown>;
  updatedAt: string;
};

export async function getUserSettings(
  userId: string
): Promise<UserSettingsRecord> {
  if (useMemoryBackend()) {
    return memory.memoryGetUserSettings(userId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_settings')
    .select('user_id, settings, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      userId,
      settings: {},
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    userId: data.user_id,
    settings: (data.settings as Record<string, unknown>) ?? {},
    updatedAt: data.updated_at,
  };
}

export async function upsertUserSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<UserSettingsRecord> {
  if (useMemoryBackend()) {
    return memory.memoryUpsertUserSettings(userId, settings);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        settings,
      },
      { onConflict: 'user_id' }
    )
    .select('user_id, settings, updated_at')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not save settings');
  }

  return {
    userId: data.user_id,
    settings: (data.settings as Record<string, unknown>) ?? {},
    updatedAt: data.updated_at,
  };
}

export async function patchUserSettings(
  userId: string,
  patch: Record<string, unknown>
): Promise<UserSettingsRecord> {
  const current = await getUserSettings(userId);
  return upsertUserSettings(userId, { ...current.settings, ...patch });
}
