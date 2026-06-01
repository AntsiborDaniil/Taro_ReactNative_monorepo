import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';

export async function listFavoriteCardIds(userId: string): Promise<string[]> {
  if (useMemoryBackend()) {
    return memory.memoryListFavoriteCardIds(userId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('favorite_cards')
    .select('card_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.card_id as string);
}

export async function addFavoriteCard(
  userId: string,
  cardId: string
): Promise<void> {
  if (useMemoryBackend()) {
    memory.memoryAddFavoriteCard(userId, cardId);
    return;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('favorite_cards').upsert(
    {
      user_id: userId,
      card_id: cardId.trim(),
    },
    { onConflict: 'user_id,card_id', ignoreDuplicates: true }
  );

  if (error) {
    throw error;
  }
}

export async function removeFavoriteCard(
  userId: string,
  cardId: string
): Promise<boolean> {
  if (useMemoryBackend()) {
    return memory.memoryRemoveFavoriteCard(userId, cardId);
  }

  const admin = getSupabaseAdmin();
  const { error, count } = await admin
    .from('favorite_cards')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('card_id', cardId.trim());

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}
