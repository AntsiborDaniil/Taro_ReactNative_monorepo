import { describe, expect, it, vi } from 'vitest';

// Memory-бэкенд: реестр подписчиков живёт в памяти, Supabase не нужен.
vi.mock('../src/lib/devMode', () => ({ useMemoryBackend: () => true }));

import {
  getSubscriberLanguage,
  recordSubscriberEvent,
} from '../src/services/telegramSubscribersService';

describe('recordSubscriberEvent: language_code', () => {
  it('обновляется у существующего подписчика при смене языка Telegram', async () => {
    await recordSubscriberEvent({ telegramId: 9001, event: 'interaction', languageCode: 'ru' });
    expect(await getSubscriberLanguage(9001)).toBe('ru');
    await recordSubscriberEvent({ telegramId: 9001, event: 'interaction', languageCode: 'en' });
    expect(await getSubscriberLanguage(9001)).toBe('en');
    await recordSubscriberEvent({ telegramId: 9001, event: 'miniapp', languageCode: 'ru-RU' });
    expect(await getSubscriberLanguage(9001)).toBe('ru-RU');
  });

  it('null / пустая строка не стирают известный язык', async () => {
    await recordSubscriberEvent({ telegramId: 9002, event: 'interaction', languageCode: 'en' });
    await recordSubscriberEvent({ telegramId: 9002, event: 'blocked' });
    await recordSubscriberEvent({ telegramId: 9002, event: 'unblocked', languageCode: null });
    await recordSubscriberEvent({ telegramId: 9002, event: 'interaction', languageCode: '  ' });
    expect(await getSubscriberLanguage(9002)).toBe('en');
  });
});
