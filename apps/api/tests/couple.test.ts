import { describe, expect, it } from 'vitest';
import { cleanName, isCoupleSpread } from '../src/lib/couple';

describe('cleanName', () => {
  it('убирает переносы и режет длину', () => {
    expect(cleanName('  Ива\nн  ')).toBe('Ива н');
    expect(cleanName('x'.repeat(40))).toHaveLength(24);
  });
});

describe('isCoupleSpread', () => {
  it('узнаёт только together_couple', () => {
    expect(isCoupleSpread('together_couple')).toBe(true);
    expect(isCoupleSpread('together_pair')).toBe(false);
  });
});
