import { applyTheme } from './theme';

/**
 * «Мир» приложения: Таро или Астрология. Слово theme занято светлой/тёмной темой,
 * поэтому здесь section. Источник правды — адрес (/astro/*), последний выбор
 * помнится, чтобы вкладка «Главная» открывала тот мир, где пользователь был.
 */
export type AppSection = 'tarot' | 'astro';

/**
 * Астрология пока в разработке: переключатель и анонс показывают «Скоро», /astro/* уводит на Главную.
 * Включить мир — поставить true.
 */
export const ASTRO_ENABLED = false;

const STORAGE_KEY = 'section';

/** Цвет неба астро-мира — для шапки Telegram и <meta theme-color>. */
const ASTRO_CANVAS = { dark: '#0c1324', light: '#eef0f7' } as const;

export function sectionOfPath(pathname: string): AppSection {
  return pathname === '/astro' || pathname.startsWith('/astro/') ? 'astro' : 'tarot';
}

export function getLastSection(): AppSection {
  if (!ASTRO_ENABLED) return 'tarot';
  try {
    return localStorage.getItem(STORAGE_KEY) === 'astro' ? 'astro' : 'tarot';
  } catch {
    return 'tarot';
  }
}

export function setLastSection(section: AppSection): void {
  try {
    localStorage.setItem(STORAGE_KEY, section);
  } catch {
    /* приватный режим */
  }
}

/** Путь вкладки «Главная» с учётом последнего мира. */
export function homePath(): string {
  return getLastSection() === 'astro' ? '/astro' : '/';
}

/** data-section на <html>: токены tokens.css перекрашивают все компоненты; плюс шапка Telegram. */
export function applySection(section: AppSection): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if ((root.dataset.section ?? 'tarot') === section) return;
  if (section === 'astro') root.dataset.section = 'astro';
  else delete root.dataset.section;
  // Тема сама выставит цвета Telegram/meta; в астро-мире поверх — цвет ночного неба.
  applyTheme();
  if (section !== 'astro') return;
  const canvas = root.dataset.theme === 'light' ? ASTRO_CANVAS.light : ASTRO_CANVAS.dark;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas);
  const tg = (
    window as { Telegram?: { WebApp?: { initData?: string; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } }
  ).Telegram?.WebApp;
  if (tg?.initData) {
    tg.setHeaderColor?.(canvas);
    tg.setBackgroundColor?.(canvas);
  }
}
