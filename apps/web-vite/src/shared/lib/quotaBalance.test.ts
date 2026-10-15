import { describe, expect, it } from 'vitest';
import { computeQuotaBalance } from './quotaBalance';

describe('computeQuotaBalance', () => {
  it('новый пользователь: свободный слот + стартовый заряд', () => {
    const b = computeQuotaBalance({ tarotDaily: { used: 0, limit: 1 }, spreadCredits: 1 });
    expect(b).toEqual({ quotaReady: true, dailyRemaining: 1, credits: 1, total: 2 });
  });
  it('слот израсходован — остаются только заряды', () => {
    expect(computeQuotaBalance({ tarotDaily: { used: 1, limit: 1 }, spreadCredits: 2 }).total).toBe(2);
  });
  it('used > limit не уходит в минус', () => {
    expect(computeQuotaBalance({ tarotDaily: { used: 5, limit: 1 }, spreadCredits: 0 }).dailyRemaining).toBe(0);
  });
  it('квота неизвестна — quotaReady=false, заряды всё равно считаются', () => {
    const b = computeQuotaBalance({ tarotDaily: null, spreadCredits: 3 });
    expect(b.quotaReady).toBe(false);
    expect(b.total).toBe(3);
  });
  it('null/undefined заряды = 0', () => {
    expect(computeQuotaBalance({ tarotDaily: undefined, spreadCredits: undefined }).total).toBe(0);
  });
});
