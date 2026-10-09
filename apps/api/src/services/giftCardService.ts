import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';
import { GIFT_MAX_PER_DAY, GIFT_TTL_MS, dayAgoIso, type GiftOccasion } from '../lib/pairGiftRules';
import { generateGiftMessage } from './spreadInterpretationService';
import { refundSpreadSlot, tryConsumeSpreadSlot } from './tarotDailyUsageService';
import { notifyUserSoft, toNotifyLang } from './userNotifyService';

export type GiftCard = { card_id?: string; card: string; direction: string };

/** Строка gift_cards (имена колонок БД). */
export type GiftRow = {
  id: string;
  sender_id: string;
  recipient_name: string;
  occasion: GiftOccasion;
  note: string;
  card: GiftCard;
  message: string;
  language: string;
  opened_at: string | null;
  expires_at: string;
  created_at: string;
};

async function insertGift(row: Omit<GiftRow, 'id' | 'created_at'>): Promise<GiftRow> {
  if (useMemoryBackend()) return memory.memoryInsertGift(row);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('gift_cards').insert(row).select('*').single();
  if (error || !data) throw error ?? new Error('Could not create gift card');
  return data as GiftRow;
}

async function getGiftRow(id: string): Promise<GiftRow | null> {
  if (useMemoryBackend()) return memory.memoryGetGift(id);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('gift_cards').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as GiftRow | null) ?? null;
}

async function countGiftsSince(senderId: string, sinceIso: string): Promise<number> {
  if (useMemoryBackend()) return memory.memoryCountGiftsSince(senderId, sinceIso);
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from('gift_cards')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', senderId)
    .gte('created_at', sinceIso);
  if (error) throw error;
  return count ?? 0;
}

/** Помечает первое открытие: вернёт строку только тому, кто реально поставил opened_at. */
async function markGiftOpened(id: string, nowIso: string): Promise<GiftRow | null> {
  if (useMemoryBackend()) return memory.memoryMarkGiftOpened(id, nowIso);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('gift_cards')
    .update({ opened_at: nowIso })
    .eq('id', id)
    .is('opened_at', null)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as GiftRow | null) ?? null;
}

export type CreateGiftInput = {
  recipientName: string;
  occasion: GiftOccasion;
  note: string;
  card: GiftCard;
  language: string;
};

export type CreateGiftResult =
  | {
      ok: true;
      row: GiftRow;
      tarotDaily: { used: number; limit: number; day: string };
      spreadCredits: number;
    }
  | { ok: false; code: 'gift_daily_limit' }
  | {
      ok: false;
      code: 'daily_limit_reached';
      tarotDaily: { used: number; limit: number; day: string };
      spreadCredits: number;
    };

/**
 * Создаёт открытку за ⚡1 (как обычный расклад). Лимит в сутки — защита от спама.
 * Заряд списывается до модели и возвращается, если открытка не создалась.
 */
export async function createGiftCard(senderId: string, input: CreateGiftInput): Promise<CreateGiftResult> {
  if ((await countGiftsSince(senderId, dayAgoIso())) >= GIFT_MAX_PER_DAY) {
    return { ok: false, code: 'gift_daily_limit' };
  }
  const slot = await tryConsumeSpreadSlot(senderId);
  if (!slot.ok) {
    return {
      ok: false,
      code: 'daily_limit_reached',
      tarotDaily: { used: slot.used, limit: slot.limit, day: slot.day },
      spreadCredits: slot.spreadCredits,
    };
  }
  try {
    const message = await generateGiftMessage({
      language: input.language,
      recipientName: input.recipientName,
      occasion: input.occasion,
      note: input.note,
      card: input.card,
    });
    const row = await insertGift({
      sender_id: senderId,
      recipient_name: input.recipientName,
      occasion: input.occasion,
      note: input.note,
      card: input.card,
      message,
      language: input.language,
      opened_at: null,
      expires_at: new Date(Date.now() + GIFT_TTL_MS).toISOString(),
    });
    return {
      ok: true,
      row,
      tarotDaily: { used: slot.used, limit: slot.limit, day: slot.day },
      spreadCredits: slot.spreadCredits,
    };
  } catch (error) {
    try {
      await refundSpreadSlot(senderId, slot.source);
    } catch (refundError) {
      console.error('[gifts] create refund failed:', refundError);
    }
    throw error;
  }
}

export type GiftView = {
  id: string;
  isOwner: boolean;
  recipientName: string;
  occasion: GiftOccasion;
  note: string;
  card: GiftCard;
  message: string;
  language: string;
  /** Получатель уже открывал карту (видно владельцу). */
  opened: boolean;
  /** Когда получатель впервые открыл карту (видно владельцу), иначе null. */
  openedAt: string | null;
  expiresAt: string;
};

/** Публичный просмотр: ссылка с id — «ключ». user_id отправителя наружу не отдаётся. */
export async function getGiftViewFor(
  id: string,
  viewerId: string | null,
): Promise<{ ok: true; view: GiftView } | { ok: false; code: 'not_found' | 'expired' }> {
  const row = await getGiftRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, code: 'expired' };
  return {
    ok: true,
    view: {
      id: row.id,
      isOwner: viewerId !== null && viewerId === row.sender_id,
      recipientName: row.recipient_name,
      occasion: row.occasion,
      note: row.note,
      card: row.card,
      message: row.message,
      language: row.language,
      opened: row.opened_at !== null,
      openedAt: row.opened_at,
      expiresAt: row.expires_at,
    },
  };
}

/**
 * Получатель перевернул карту: ставим opened_at (один раз) и шлём отправителю
 * уведомление. Открытие самим отправителем не считается. Soft-fail.
 */
export async function openGiftCard(
  id: string,
  viewerId: string | null,
): Promise<{ ok: true; firstOpen: boolean } | { ok: false; code: 'not_found' | 'expired' }> {
  const row = await getGiftRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, code: 'expired' };
  if (viewerId !== null && viewerId === row.sender_id) return { ok: true, firstOpen: false };

  const marked = await markGiftOpened(id, new Date().toISOString());
  if (!marked) return { ok: true, firstOpen: false };

  const lang = toNotifyLang(row.language);
  const name = row.recipient_name.trim() || (lang === 'ru' ? 'Друг' : 'Your friend');
  await notifyUserSoft({
    userId: row.sender_id,
    text:
      lang === 'ru'
        ? `${name} открыл(а) карту, которую ты вытянул(а) ✦`
        : `${name} opened the card you drew ✦`,
    path: `/gift/${id}`,
    lang,
    buttonText: lang === 'ru' ? 'Открыть' : 'Open',
  });
  return { ok: true, firstOpen: true };
}
