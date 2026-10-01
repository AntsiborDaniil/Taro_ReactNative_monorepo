/**
 * Проверки текстов под ограничения Telegram Bot API.
 * Правила legacy-Markdown (parse_mode: 'Markdown'): *жирный*, _курсив_, `код`, [label](url).
 */

export const TELEGRAM_TEXT_LIMIT = 4096;
export const TELEGRAM_CALLBACK_DATA_LIMIT = 64;

const LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g;

/** Маркеры вне ссылок: в `[label](url)` скобки не парные для разметки. */
function stripLinks(text: string): string {
  return text.replace(LINK_RE, '$1');
}

export function countMarker(text: string, marker: string): number {
  return stripLinks(text).split(marker).length - 1;
}

/** Непарный маркер ломает разбор entity — Telegram отвечает 400. */
export function hasBalancedMarkers(text: string): boolean {
  return (
    countMarker(text, '*') % 2 === 0 &&
    countMarker(text, '_') % 2 === 0 &&
    countMarker(text, '`') % 2 === 0
  );
}

export function collectLinks(text: string): Array<{ label: string; url: string }> {
  return [...text.matchAll(LINK_RE)].map(([, label, url]) => ({ label, url }));
}

/** Все открывающие `[` должны быть частью ссылки. */
export function countStrayBrackets(text: string): number {
  return (text.match(/\[/g) ?? []).length - collectLinks(text).length;
}

export function collectCommands(text: string): string[] {
  return [...text.matchAll(/(?:^|\s)\/([a-z_]+)/g)].map(([, name]) => name);
}
