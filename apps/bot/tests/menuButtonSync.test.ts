import { describe, expect, it } from 'vitest';
import type { BotLang } from '../src/lang';
import { forgetMenuButtonLang, shouldSyncMenuButton } from '../src/menuButtonSync';

describe('shouldSyncMenuButton', () => {
  it('неизвестный чат (после рестарта) → выставляем один раз', () => {
    const store = new Map<number, BotLang>();
    expect(shouldSyncMenuButton(1, 'ru', store)).toBe(true);
    expect(shouldSyncMenuButton(1, 'ru', store)).toBe(false);
    expect(shouldSyncMenuButton(1, 'ru', store)).toBe(false);
  });

  it('смена языка Telegram → обновляем, затем снова тишина', () => {
    const store = new Map<number, BotLang>([[1, 'ru']]);
    expect(shouldSyncMenuButton(1, 'en', store)).toBe(true);
    expect(store.get(1)).toBe('en');
    expect(shouldSyncMenuButton(1, 'en', store)).toBe(false);
    expect(shouldSyncMenuButton(1, 'ru', store)).toBe(true);
  });

  it('сбой setChatMenuButton → forget, следующий апдейт повторяет', () => {
    const store = new Map<number, BotLang>();
    expect(shouldSyncMenuButton(1, 'en', store)).toBe(true);
    forgetMenuButtonLang(1, 'en', store);
    expect(shouldSyncMenuButton(1, 'en', store)).toBe(true);
  });

  it('forget не стирает уже применённый более новый язык', () => {
    const store = new Map<number, BotLang>();
    shouldSyncMenuButton(1, 'ru', store);
    shouldSyncMenuButton(1, 'en', store);
    forgetMenuButtonLang(1, 'ru', store); // запоздалый сбой старого запроса
    expect(store.get(1)).toBe('en');
  });

  it('размер ограничен: вытесняется давно не обновлявшийся чат', () => {
    const store = new Map<number, BotLang>();
    shouldSyncMenuButton(1, 'ru', store, 2);
    shouldSyncMenuButton(2, 'ru', store, 2);
    shouldSyncMenuButton(1, 'en', store, 2); // 1 освежился → старейший теперь 2
    shouldSyncMenuButton(3, 'ru', store, 2);
    expect(store.size).toBe(2);
    expect(store.has(2)).toBe(false);
    expect(store.get(1)).toBe('en');
    expect(shouldSyncMenuButton(2, 'ru', store, 2)).toBe(true);
  });
});
