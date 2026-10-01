import { getI18n } from 'react-i18next';

export type CurrentDateFormat = 'full' | 'badge';

/**
 * Перенесено 1-в-1 из apps/web/src/shared/lib/date/getCurrentDate.ts (чистая функция,
 * без RN-зависимостей — только Intl + react-i18next). `badge` — короткий формат для
 * узкой плашки на карте дня.
 */
export function getCurrentDate(format: CurrentDateFormat = 'full'): string {
  const i18n = getI18n();
  const date = new Date();

  const formatter = new Intl.DateTimeFormat(
    i18n.language,
    format === 'badge'
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { weekday: 'long', day: 'numeric', month: 'short' },
  );

  return formatter.format(date);
}

/** Дата в формате YYYY-MM-DD (локальная, без времени) — ключ прогресса привычек/настроения. */
export function getDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type TWeekBounds = { start: Date; end: Date; days: Date[] };

/**
 * Перенесено 1-в-1 из apps/web/src/shared/lib/date/getCurrentWeekBounds.ts —
 * `days` сдвинуты на +1 от понедельника (вторник..следующий понедельник),
 * это особенность старого кода, но она самосогласована с индексами
 * frequencyDays/getLocalizedWeekdays везде, где используется.
 */
export function getCurrentWeekBounds(): TWeekBounds {
  const now = new Date();

  const start = new Date(now);
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const days: Date[] = [];
  for (let i = 1; i < 8; i += 1) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    days.push(dayDate);
  }

  return { start, end, days };
}

export type TWeekDay = { day: string; index: number };

/** Перенесено 1-в-1 из apps/web/src/shared/lib/date/getLocalizedWeekdays.ts. */
export function getLocalizedWeekdays(locale: string): TWeekDay[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return [...Array(7).keys()].map((dayIndex, index) => {
    const date = new Date(Date.UTC(2024, 0, 1 + dayIndex));
    return { index, day: formatter.format(date) };
  });
}

/**
 * Перенос apps/web/src/pages/spreadsHistory/lib/formatDate.ts — заголовок
 * секции истории раскладов («Сегодня»/«Вчера»/дата).
 */
export function formatHistoryDate(dateStr: string, todayText: string, yesterdayText: string): string {
  const spreadDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const spreadDay = spreadDate.toISOString().split('T')[0];
  const todayDay = today.toISOString().split('T')[0];
  const yesterdayDay = yesterday.toISOString().split('T')[0];

  if (spreadDay === todayDay) return todayText;
  if (spreadDay === yesterdayDay) return yesterdayText;
  return spreadDate.toLocaleDateString();
}
