export type TWeekDay = {
  day: string;
  index: number;
};

export function getLocalizedWeekdays(locale: string): TWeekDay[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return [...Array(7).keys()].map((dayIndex, index) => {
    // January 1st 2024 is a Sunday in UTC.
    const date = new Date(Date.UTC(2024, 0, 1 + dayIndex));
    return { index, day: formatter.format(date) };
  });
}
