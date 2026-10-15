import { baseApi } from '@shared/api/baseApi';
import type { ZodiacSign } from '@shared/lib/astro';

/** Грань дня словами, без процентов: тепло / ровно / бережно. */
export type HoroscopeFacet = 'warm' | 'even' | 'gentle';

/**
 * GET /api/astro/horoscope?sign=&lang= — гороскоп дня ПО ЗНАКУ (не персональный):
 * один текст на (знак, день слота с 10:00 МСК, язык), сервер кэширует. Личных данных нет.
 */
export type DailyHoroscope = {
  sign: ZodiacSign;
  /** День слота YYYY-MM-DD (сутки с 10:00 МСК). */
  day: string;
  /** 2–3 абзаца, разделены пустой строкой. */
  text: string;
  /** «Вопрос дня» — одна фраза-вопрос к себе. */
  question: string;
  facets: { love: HoroscopeFacet; work: HoroscopeFacet; energy: HoroscopeFacet };
};

export const astroApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDailyHoroscope: build.query<DailyHoroscope, { sign: ZodiacSign; lang: 'ru' | 'en' }>({
      query: ({ sign, lang }) => `/api/astro/horoscope?sign=${sign}&lang=${lang}`,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetDailyHoroscopeQuery } = astroApi;
