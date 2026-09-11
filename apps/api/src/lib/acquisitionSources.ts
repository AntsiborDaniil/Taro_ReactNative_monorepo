/** Allowed bot deep-link start payloads for marketing attribution. */
export const ACQUISITION_SOURCES = [
  'ig_bio',
  'ig_stories',
  'yt_shorts',
  'other',
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
  other: 'Other',
};
