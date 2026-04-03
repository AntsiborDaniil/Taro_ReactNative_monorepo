import { getI18n } from 'react-i18next';

export const getCurrentDate = (): string => {
  const i18n = getI18n();

  const date = new Date();

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return formatter.format(date);
};

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
