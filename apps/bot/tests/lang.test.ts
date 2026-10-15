import { describe, expect, it } from 'vitest';
import { resolveBotLang, webAppUrlWithLang } from '../src/lang';

describe('resolveBotLang', () => {
  it('ru* → ru', () => {
    expect(resolveBotLang('ru')).toBe('ru');
    expect(resolveBotLang('RU-ru')).toBe('ru');
    expect(resolveBotLang('ru_RU')).toBe('ru');
  });

  it('остальное → en', () => {
    for (const code of ['en', 'en-US', 'de', 'uk', 'pt-br']) {
      expect(resolveBotLang(code)).toBe('en');
    }
  });

  it('нет кода → ru', () => {
    expect(resolveBotLang(undefined)).toBe('ru');
    expect(resolveBotLang(null)).toBe('ru');
    expect(resolveBotLang('')).toBe('ru');
  });
});

describe('webAppUrlWithLang', () => {
  it('добавляет lang', () => {
    expect(webAppUrlWithLang('https://app.example.com', 'en')).toBe('https://app.example.com/?lang=en');
  });

  it('заменяет существующий lang и сохраняет прочие параметры', () => {
    const url = new URL(webAppUrlWithLang('https://app.example.com/x?a=1&lang=ru', 'en'));
    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.get('a')).toBe('1');
  });
});
