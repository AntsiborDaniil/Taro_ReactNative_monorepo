import { describe, expect, it } from 'vitest';
import { secureRandomInt, shuffleSecure } from './shuffleDeck';

describe('shuffleSecure', () => {
  it('сохраняет набор элементов и не мутирует вход', () => {
    const input = Array.from({ length: 78 }, (_, i) => i);
    const copy = [...input];
    const out = shuffleSecure(input);
    expect(input).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
  });

  it('меняет порядок (78 элементов не остаются на местах)', () => {
    const input = Array.from({ length: 78 }, (_, i) => i);
    expect(shuffleSecure(input)).not.toEqual(input);
  });

  it('secureRandomInt в границах', () => {
    for (let i = 0; i < 200; i += 1) {
      const n = secureRandomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
    expect(secureRandomInt(1)).toBe(0);
  });
});
