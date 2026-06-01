import { getI18n } from 'react-i18next';

export type CurrentDateFormat = 'full' | 'badge';

/** Полная дата для заголовков; `badge` — короткий формат для узкой плашки на карте. */
export const getCurrentDate = (format: CurrentDateFormat = 'full'): string => {
  const i18n = getI18n();
  const date = new Date();

  const formatter = new Intl.DateTimeFormat(
    i18n.language,
    format === 'badge'
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { weekday: 'long', day: 'numeric', month: 'short' }
  );

  return formatter.format(date);
};

/** Две строки для бейджа на карте дня — без переноса длинного «понедельник, …». */
export function getCurrentDateBadgeParts(): { weekday: string; date: string } {
  const i18n = getI18n();
  const now = new Date();

  return {
    weekday: new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
    }).format(now),
    date: new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
    }).format(now),
  };
}

export const getWeekDate = (dateString: string | number): string => {
  if (typeof dateString !== 'string') {
    return '';
  }

  const i18n = getI18n();

  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
  });

  return formatter.format(date);
};

export const getMonthDate = (dateString: string | number): string => {
  if (typeof dateString !== 'string') {
    return '';
  }

  const i18n = getI18n();

  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
  });

  return formatter.format(date);
};

export const getMonthDayDate = (dateString: string | number): string => {
  if (typeof dateString !== 'string') {
    return '';
  }

  const i18n = getI18n();

  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  });

  return formatter.format(date);
};
