import { describe, expect, it } from 'vitest';
import { resolveStartSource } from '../src/acquisition';

describe('resolveStartSource', () => {
  it('известные метки сохраняются', () => {
    expect(resolveStartSource('ig_bio')).toBe('ig_bio');
    expect(resolveStartSource(' TikTok ')).toBe('tiktok');
  });

  it('пустой и неизвестный payload → direct', () => {
    expect(resolveStartSource('')).toBe('direct');
    expect(resolveStartSource('whatever')).toBe('direct');
  });

  it('служебные payload не записываются', () => {
    for (const p of ['lava_success', 'lava_failed', 'lava_cancelled', 'r_abc123', 'pair_x', 'gift_y']) {
      expect(resolveStartSource(p)).toBeNull();
    }
  });
});
