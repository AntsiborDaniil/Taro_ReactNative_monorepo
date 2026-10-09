/** Allowed bot deep-link start payloads for marketing attribution. */
export const ACQUISITION_SOURCES = [
  'ig_bio',
  'ig_stories',
  'yt_shorts',
  'tiktok',
  'other',
  'direct',
  'pair_invite',
  'friend_card',
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

const RESERVED_START = new Set([
  'lava_success',
  'lava_failed',
  'lava_cancelled',
]);

const SOURCE_SET = new Set<string>(ACQUISITION_SOURCES);

export function isAcquisitionSource(value: string): value is AcquisitionSource {
  return SOURCE_SET.has(value);
}

export function parseAcquisitionStartPayload(
  payload: string
): AcquisitionSource | null {
  const normalized = payload.trim().toLowerCase();
  if (!normalized || RESERVED_START.has(normalized)) {
    return null;
  }
  return isAcquisitionSource(normalized) ? normalized : null;
}

export const ACQUISITION_SOURCE_LABELS: Record<AcquisitionSource, string> = {
  ig_bio: 'Instagram bio',
  ig_stories: 'Instagram stories',
  yt_shorts: 'YouTube Shorts',
  tiktok: 'TikTok',
  other: 'Other',
  direct: 'Без метки (прямой /start)',
  pair_invite: 'Расклад на двоих (приглашение)',
  friend_card: 'Карта для друга',
};

/**
 * Источник по параметру запуска Mini App (`startapp=pair_<hex32>` / `gift_<hex32>`),
 * который Telegram кладёт в подписанный initData как `start_param`.
 */
export function acquisitionSourceFromStartParam(
  startParam: string | null | undefined
): AcquisitionSource | null {
  const value = (startParam ?? '').trim().toLowerCase();
  if (/^pair_[a-f0-9]{32}$/.test(value)) return 'pair_invite';
  if (/^gift_[a-f0-9]{32}$/.test(value)) return 'friend_card';
  return null;
}
