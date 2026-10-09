import { describe, expect, it } from 'vitest';
import {
  GIFT_COST,
  GIFT_MAX_PER_DAY,
  GIFT_TTL_MS,
  HOUR_MS,
  PAIR_CONSENT_GRACE_MS,
  PAIR_TTL_MS,
  expiresAfterPartnerDraw,
  isPairExpired,
  needsExpiryRefund,
  sanitizeGiftNote,
  sanitizeShortName,
} from '../src/lib/pairGiftRules';
import { memoryClaimFreeFirst, memoryHasUsedFreeFirst, memoryReleaseFreeFirst } from '../src/dev/memoryBackend';
import { acquisitionSourceFromStartParam } from '../src/lib/acquisitionSources';
import { buildPairView, type PairRow } from '../src/services/pairReadingService';

const NOW = Date.parse('2026-10-09T12:00:00Z');
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

describe('цена и лимиты подарка', () => {
  it('карта для друга стоит ⚡1, 10 в сутки — только защита от спама', () => {
    expect(GIFT_COST).toBe(1);
    expect(GIFT_MAX_PER_DAY).toBe(10);
  });
});

describe('первый раз бесплатно (memory-бэкенд)', () => {
  it('занимается один раз, release возвращает бесплатность, фичи независимы', () => {
    expect(memoryClaimFreeFirst('u1', 'deep')).toBe(true);
    expect(memoryClaimFreeFirst('u1', 'deep')).toBe(false);
    expect(memoryHasUsedFreeFirst('u1', 'deep')).toBe(true);
    expect(memoryClaimFreeFirst('u1', 'pair')).toBe(true);
    expect(memoryClaimFreeFirst('u2', 'deep')).toBe(true);
    memoryReleaseFreeFirst('u1', 'deep');
    expect(memoryHasUsedFreeFirst('u1', 'deep')).toBe(false);
    expect(memoryClaimFreeFirst('u1', 'deep')).toBe(true);
  });
});

describe('срок приглашения и возврат', () => {
  it('ttl: пара 72 часа, подарок 30 дней', () => {
    expect(PAIR_TTL_MS).toBe(72 * HOUR_MS);
    expect(GIFT_TTL_MS).toBe(30 * 24 * HOUR_MS);
  });

  it('истекает только открытое приглашение (waiting/drawn)', () => {
    expect(isPairExpired({ status: 'waiting', expires_at: iso(-1) }, NOW)).toBe(true);
    expect(isPairExpired({ status: 'drawn', expires_at: iso(-1) }, NOW)).toBe(true);
    expect(isPairExpired({ status: 'waiting', expires_at: iso(1) }, NOW)).toBe(false);
    expect(isPairExpired({ status: 'shared', expires_at: iso(-1) }, NOW)).toBe(false);
    expect(isPairExpired({ status: 'revoked', expires_at: iso(-1) }, NOW)).toBe(false);
  });

  it('возврат нужен один раз: после refunded=true — нет', () => {
    const base = { status: 'waiting', expires_at: iso(-1000) };
    expect(needsExpiryRefund({ ...base, refunded: false }, NOW)).toBe(true);
    expect(needsExpiryRefund({ ...base, refunded: true }, NOW)).toBe(false);
    expect(needsExpiryRefund({ status: 'waiting', expires_at: iso(1000), refunded: false }, NOW)).toBe(false);
  });

  it('после карт партнёра на согласие остаётся минимум сутки', () => {
    expect(expiresAfterPartnerDraw(iso(HOUR_MS), NOW)).toBe(iso(PAIR_CONSENT_GRACE_MS));
    expect(expiresAfterPartnerDraw(iso(48 * HOUR_MS), NOW)).toBe(iso(48 * HOUR_MS));
  });
});

describe('валидация текстов', () => {
  it('записка: до 140 символов, без ссылок и @', () => {
    expect(sanitizeGiftNote('  Ты справишься  ')).toEqual({ ok: true, value: 'Ты справишься' });
    expect(sanitizeGiftNote('')).toEqual({ ok: true, value: '' });
    expect(sanitizeGiftNote('я'.repeat(141))).toEqual({ ok: false, code: 'too_long' });
    expect(sanitizeGiftNote('я'.repeat(140)).ok).toBe(true);
    for (const bad of ['смотри https://x.io', 'пиши @user', 'www.site', 'заходи t.me/abc', 'сайт example.com', '<b>x</b>']) {
      expect(sanitizeGiftNote(bad)).toEqual({ ok: false, code: 'link_or_mention' });
    }
  });

  it('имя: до 24 символов, без ссылок и @', () => {
    expect(sanitizeShortName('Аня')).toEqual({ ok: true, value: 'Аня' });
    expect(sanitizeShortName(undefined)).toEqual({ ok: true, value: '' });
    expect(sanitizeShortName('а'.repeat(25))).toEqual({ ok: false, code: 'too_long' });
    expect(sanitizeShortName('@anya')).toEqual({ ok: false, code: 'link_or_mention' });
  });
});

describe('приватность представления пары', () => {
  const row: PairRow = {
    id: 'p1',
    author_id: 'author',
    partner_id: 'partner',
    question: 'секретный вопрос',
    show_question: false,
    inviter_name: 'Аня',
    relation: 'friend',
    language: 'ru',
    author_cards: [{ card: 'Маг', direction: 'upright', label: 'a' }],
    partner_cards: [{ card: 'Шут', direction: 'upright', label: 'a' }],
    author_personal: 'личное автора',
    partner_personal: 'личное партнёра',
    pair_interpretation: 'общее чтение',
    status: 'shared',
    is_free: false,
    charged: 2,
    charge_sources: ['credit', 'credit'],
    refunded: false,
    joined_at: iso(-HOUR_MS),
    expires_at: iso(HOUR_MS),
    created_at: iso(-2 * HOUR_MS),
    updated_at: iso(-HOUR_MS),
  };

  it('партнёр не видит вопрос (show_question=false) и личное автора', () => {
    const view = buildPairView(row, 'partner', NOW);
    expect(view.question).toBeNull();
    expect(view.authorPersonal).toBeNull();
    expect(view.authorCards).not.toBeNull(); // после согласия делиться
    expect(JSON.stringify(view)).not.toContain('author"');
    expect(JSON.stringify(view)).not.toContain('личное автора');
  });

  it('автор видит всё своё; партнёрские карты — только при shared', () => {
    expect(buildPairView(row, 'author', NOW).question).toBe('секретный вопрос');
    expect(buildPairView({ ...row, status: 'declined' }, 'author', NOW).partnerCards).toBeNull();
    expect(buildPairView(row, 'author', NOW).partnerCards).not.toBeNull();
  });

  it('посетитель не видит карты, а занятый слот даёт taken', () => {
    const view = buildPairView({ ...row, status: 'waiting' }, 'stranger', NOW);
    expect(view.status).toBe('taken');
    expect(view.authorCards).toBeNull();
    expect(view.partnerCards).toBeNull();
    expect(view.pairInterpretation).toBeNull();
  });

  it('партнёр до согласия не видит карты автора', () => {
    const view = buildPairView({ ...row, status: 'drawn' }, 'partner', NOW);
    expect(view.authorCards).toBeNull();
    expect(view.partnerCards).not.toBeNull();
  });
});

describe('атрибуция по start_param', () => {
  it('pair_/gift_ + 32 hex', () => {
    const hex = 'a'.repeat(32);
    expect(acquisitionSourceFromStartParam(`pair_${hex}`)).toBe('pair_invite');
    expect(acquisitionSourceFromStartParam(`gift_${hex}`)).toBe('friend_card');
    expect(acquisitionSourceFromStartParam('r_' + hex)).toBeNull();
    expect(acquisitionSourceFromStartParam('pair_short')).toBeNull();
    expect(acquisitionSourceFromStartParam(undefined)).toBeNull();
  });
});
