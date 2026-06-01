import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';

export type SpreadRecord = {
  id: string;
  userId: string;
  spreadKey: string;
  name: string;
  category: string | null;
  question: string | null;
  interpretation: string | null;
  cardsCount: number;
  packIndex: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type SpreadRow = {
  id: string;
  user_id: string;
  spread_key: string;
  name: string;
  category: string | null;
  question: string | null;
  interpretation: string | null;
  cards_count: number;
  pack_index: number;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SpreadRow): SpreadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    spreadKey: row.spread_key,
    name: row.name,
    category: row.category,
    question: row.question,
    interpretation: row.interpretation,
    cardsCount: row.cards_count,
    packIndex: row.pack_index,
    payload: row.payload ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSpreads(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<SpreadRecord[]> {
  if (useMemoryBackend()) {
    return memory.memoryListSpreads(userId, options);
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('spreads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRow(row as SpreadRow));
}

export async function createSpread(
  userId: string,
  input: {
    spreadKey: string;
    name: string;
    category?: string | null;
    question?: string | null;
    interpretation?: string | null;
    cardsCount?: number;
    packIndex?: number;
    payload: Record<string, unknown>;
  }
): Promise<SpreadRecord> {
  if (useMemoryBackend()) {
    return memory.memoryCreateSpread(userId, input);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('spreads')
    .insert({
      user_id: userId,
      spread_key: input.spreadKey,
      name: input.name,
      category: input.category ?? null,
      question: input.question ?? '',
      interpretation: input.interpretation ?? null,
      cards_count: input.cardsCount ?? 0,
      pack_index: input.packIndex ?? 0,
      payload: input.payload,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not create spread');
  }

  return mapRow(data as SpreadRow);
}

export async function updateSpread(
  userId: string,
  spreadId: string,
  input: {
    interpretation?: string | null;
    payload?: Record<string, unknown>;
    question?: string | null;
  }
): Promise<SpreadRecord | null> {
  if (useMemoryBackend()) {
    return memory.memoryUpdateSpread(userId, spreadId, input);
  }

  const admin = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};

  if (input.interpretation !== undefined) {
    patch.interpretation = input.interpretation;
  }
  if (input.payload !== undefined) {
    patch.payload = input.payload;
  }
  if (input.question !== undefined) {
    patch.question = input.question;
  }

  const { data, error } = await admin
    .from('spreads')
    .update(patch)
    .eq('id', spreadId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRow(data as SpreadRow) : null;
}

export async function getSpreadById(
  userId: string,
  spreadId: string
): Promise<SpreadRecord | null> {
  if (useMemoryBackend()) {
    return memory.memoryGetSpreadById(userId, spreadId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('spreads')
    .select('*')
    .eq('id', spreadId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRow(data as SpreadRow) : null;
}
