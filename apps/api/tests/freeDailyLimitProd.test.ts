import { afterEach, describe, expect, it, vi } from 'vitest';

// Прод (Supabase): лимит бесплатного заряда не настраивается env — всегда 1.
vi.mock('../src/lib/devMode', () => ({ useMemoryBackend: () => false }));

import { getTarotDailyLimit } from '../src/lib/env';

describe('лимит бесплатного заряда на проде', () => {
  afterEach(() => {
    delete process.env.TAROT_DAILY_INTERPRET_LIMIT;
  });

  it('всегда 1, даже если TAROT_DAILY_INTERPRET_LIMIT больше', () => {
    expect(getTarotDailyLimit()).toBe(1);
    process.env.TAROT_DAILY_INTERPRET_LIMIT = '5';
    expect(getTarotDailyLimit()).toBe(1);
  });
});
