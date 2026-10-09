/** Контракты API «Карты для друга» (apps/api/src/routes/gifts.ts). */

export const GIFT_OCCASIONS = ['support', 'birthday', 'important_day', 'just_because'] as const;
export type GiftOccasion = (typeof GIFT_OCCASIONS)[number];

export const GIFT_NAME_MAX = 24;
export const GIFT_NOTE_MAX = 140;

export type GiftCardDto = { card_id?: string; card: string; direction: string };

export type GiftView = {
  id: string;
  isOwner: boolean;
  recipientName: string;
  occasion: GiftOccasion;
  note: string;
  card: GiftCardDto;
  message: string;
  language: string;
  opened: boolean;
  openedAt: string | null;
  expiresAt: string;
};

export type CreateGiftBody = {
  recipientName: string;
  occasion: GiftOccasion;
  note: string;
  language: string;
  card: GiftCardDto;
};

export type CreateGiftResponse = { id: string; message: string; expiresAt: string; spreadCredits?: number };

export type GiftErrorBody = { code?: string; message?: string };

/** Клиентская проверка записки (сервер проверяет то же самое): без ссылок и @. */
const LINK_RE =
  /(https?:\/\/|www\.|\bt\.me\b|\btelegram\.me\b|\b[a-z0-9-]+\.(?:com|ru|org|net|io|me|ly|app|xyz|su|info|bio|cc|to|gg|рф)\b)/i;

export function hasLinkOrMention(text: string): boolean {
  return LINK_RE.test(text) || text.includes('@') || /[<>]/.test(text);
}
