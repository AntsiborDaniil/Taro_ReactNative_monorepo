import { describe, expect, it } from 'vitest';
import {
  buildSharedReadingWebAppUrl,
  parseSharedReadingStartPayload,
} from '../src/sharedReading';

const UID = '11111111-1111-4111-8111-111111111111';
const PAYLOAD = `r_${UID.replace(/-/g, '')}`;

describe('пейлоад шаринга расклада', () => {
  it('r_<hex32> разворачивается обратно в UUID', () => {
    expect(parseSharedReadingStartPayload(PAYLOAD)).toBe(UID);
  });

  it('регистр и пробелы не мешают', () => {
    expect(parseSharedReadingStartPayload(` ${PAYLOAD.toUpperCase()} `)).toBe(UID);
  });

  it('платёжные пейлоады Lava не перехватываются', () => {
    for (const payload of ['lava_success', 'lava_failed', 'lava_cancelled', 'ig_bio', '']) {
      expect(parseSharedReadingStartPayload(payload)).toBeNull();
    }
  });

  it('обрезанный или слишком длинный hex не принимается', () => {
    expect(parseSharedReadingStartPayload('r_1111')).toBeNull();
    expect(parseSharedReadingStartPayload(`${PAYLOAD}00`)).toBeNull();
  });
});

describe('ссылка на Mini App с раскладом', () => {
  it('добавляет ?reading=<uuid>&lang= к WEB_APP_URL', () => {
    const url = new URL(buildSharedReadingWebAppUrl(UID, 'en'));
    expect(url.protocol).toBe('https:');
    expect(url.searchParams.get('reading')).toBe(UID);
    expect(url.searchParams.get('lang')).toBe('en');
  });
});

describe('пейлоады пары и подарка', () => {
  const HEX = UID.replace(/-/g, '');

  it('pair_/gift_ + hex32 → вид и UUID', async () => {
    const { parseTogetherStartPayload } = await import('../src/sharedReading');
    expect(parseTogetherStartPayload(`pair_${HEX}`)).toEqual({ kind: 'pair', id: UID });
    expect(parseTogetherStartPayload(`GIFT_${HEX}`)).toEqual({ kind: 'gift', id: UID });
  });

  it('чужие и битые пейлоады не перехватываются', async () => {
    const { parseTogetherStartPayload } = await import('../src/sharedReading');
    for (const p of [PAYLOAD, 'pair_1111', `pair_${HEX}00`, 'ig_bio', 'lava_success', '']) {
      expect(parseTogetherStartPayload(p)).toBeNull();
    }
  });

  it('ссылка Mini App ведёт на /pair/<uuid>', async () => {
    const { buildTogetherWebAppUrl } = await import('../src/sharedReading');
    const url = new URL(buildTogetherWebAppUrl({ kind: 'pair', id: UID }, 'en'));
    expect(url.pathname).toBe(`/pair/${UID}`);
    expect(url.searchParams.get('lang')).toBe('en');
  });
});
