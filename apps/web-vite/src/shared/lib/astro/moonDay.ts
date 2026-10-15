import { skyToday, type SkyToday } from './engine';

/**
 * Небо на 12:00 МСК (09:00 UTC) указанного календарного дня — единая точка отсчёта
 * для календаря: у каждого дня одна фаза, независимо от часового пояса пользователя.
 */
export function skyAtMoscowNoon(year: number, month: number, day: number): SkyToday {
  return skyToday(new Date(Date.UTC(year, month - 1, day, 9, 0, 0)));
}
