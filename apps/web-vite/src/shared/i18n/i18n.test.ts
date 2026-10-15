import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { languageFromTelegramCode, normalizeLanguage } from './namespaces';
import { changeLanguage, i18nReady, syncLanguageFromTelegram } from './index';
import { readTelegramLanguageCode, resolveInitialLanguage } from './resolveLanguage';

type TgWindow = { Telegram?: unknown };

function setTelegram(user?: { language_code?: string }, initData?: string) {
  (window as unknown as TgWindow).Telegram = { WebApp: { initDataUnsafe: { user }, initData } };
}

function setUrl(search = '', hash = '') {
  window.history.replaceState(null, '', `/${search}${hash}`);
}

function launchHash(code: string): string {
  const data = new URLSearchParams({ user: JSON.stringify({ id: 1, language_code: code }) }).toString();
  return `#tgWebAppData=${encodeURIComponent(data)}&tgWebAppVersion=8.0`;
}

beforeEach(() => {
  window.localStorage.clear();
  delete (window as unknown as TgWindow).Telegram;
  setUrl();
});

afterEach(async () => {
  window.localStorage.clear();
  delete (window as unknown as TgWindow).Telegram;
  setUrl();
  await i18next.changeLanguage('ru');
});

describe('normalizeLanguage / languageFromTelegramCode', () => {
  it('normalizeLanguage: en/ru и fallback ru', () => {
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('RU')).toBe('ru');
    expect(normalizeLanguage('de')).toBe('ru');
    expect(normalizeLanguage(null)).toBe('ru');
  });

  it('languageFromTelegramCode: ru* → ru, иначе en', () => {
    expect(languageFromTelegramCode('ru')).toBe('ru');
    expect(languageFromTelegramCode('ru-RU')).toBe('ru');
    expect(languageFromTelegramCode('en')).toBe('en');
    expect(languageFromTelegramCode('de')).toBe('en');
    expect(languageFromTelegramCode(undefined)).toBe('ru');
  });
});

describe('resolveInitialLanguage', () => {
  it('по умолчанию ru', () => {
    expect(resolveInitialLanguage()).toBe('ru');
  });

  it('saved используется, если нет Telegram и ?lang', () => {
    window.localStorage.setItem('language', 'en');
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('?lang важнее saved', () => {
    window.localStorage.setItem('language', 'ru');
    setUrl('?lang=en');
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('Telegram важнее ?lang (устаревшая Menu Button) и saved', () => {
    window.localStorage.setItem('language', 'ru');
    setUrl('?lang=ru');
    setTelegram({ language_code: 'en' });
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('читает язык из initData, если initDataUnsafe пуст', () => {
    const initData = new URLSearchParams({ user: JSON.stringify({ language_code: 'de' }) }).toString();
    setTelegram(undefined, initData);
    expect(readTelegramLanguageCode()).toBe('de');
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('читает язык из hash запуска до загрузки моста', () => {
    setUrl('', launchHash('en'));
    expect(resolveInitialLanguage()).toBe('en');
    setUrl('', launchHash('ru'));
    expect(resolveInitialLanguage()).toBe('ru');
  });

  it('ручной выбор главнее всего', () => {
    window.localStorage.setItem('languageManual', '1');
    window.localStorage.setItem('language', 'ru');
    setUrl('?lang=en');
    setTelegram({ language_code: 'en' });
    expect(resolveInitialLanguage()).toBe('ru');
  });
});

describe('syncLanguageFromTelegram', () => {
  it('поздний bridge переключает язык', async () => {
    await i18nReady;
    await i18next.changeLanguage('ru');
    expect(await syncLanguageFromTelegram()).toBeNull();
    setTelegram({ language_code: 'en' });
    expect(await syncLanguageFromTelegram()).toBe('en');
    expect(i18next.language).toBe('en');
  });

  it('ручной выбор не перетирается', async () => {
    await i18nReady;
    await changeLanguage('ru');
    setTelegram({ language_code: 'en' });
    expect(await syncLanguageFromTelegram()).toBeNull();
    expect(i18next.language).toBe('ru');
  });
});
