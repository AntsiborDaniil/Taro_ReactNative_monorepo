import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';

/** «Первый раз бесплатно»: одна запись на аккаунт и функцию. */
export type FreeFirstFeature = 'deep' | 'pair';

/** Атомарно занять бесплатное использование: true — вставилось (разбор бесплатный). */
export async function claimFreeFirst(userId: string, feature: FreeFirstFeature): Promise<boolean> {
  if (useMemoryBackend()) return memory.memoryClaimFreeFirst(userId, feature);
  const { error } = await getSupabaseAdmin().from('free_first_uses').insert({ user_id: userId, feature });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

/** Ошибка модели — возвращаем бесплатность. */
export async function releaseFreeFirst(userId: string, feature: FreeFirstFeature): Promise<void> {
  if (useMemoryBackend()) {
    memory.memoryReleaseFreeFirst(userId, feature);
    return;
  }
  const { error } = await getSupabaseAdmin().from('free_first_uses').delete().match({ user_id: userId, feature });
  if (error) throw error;
}

export async function hasUsedFreeFirst(userId: string, feature: FreeFirstFeature): Promise<boolean> {
  if (useMemoryBackend()) return memory.memoryHasUsedFreeFirst(userId, feature);
  const { count, error } = await getSupabaseAdmin()
    .from('free_first_uses')
    .select('user_id', { count: 'exact', head: true })
    .match({ user_id: userId, feature });
  if (error) throw error;
  return (count ?? 0) > 0;
}
