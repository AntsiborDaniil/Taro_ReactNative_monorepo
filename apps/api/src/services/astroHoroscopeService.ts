import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { useMockOpenAi } from '../lib/devMode';
import { mockGenerateHoroscope } from '../dev/mockOpenAi';
import { tarotSlotDay } from '../lib/tarotSlotDay';
dotenv.config();

/**
 * Гороскоп дня ПО ЗНАКУ. Личных данных нет: в модель уходят только знак, дата и фаза Луны.
 * Кэш в памяти процесса: максимум 12 знаков × 2 языка = 24 генерации в сутки слота.
 */
export const HOROSCOPE_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type HoroscopeSign = (typeof HOROSCOPE_SIGNS)[number];
export type HoroscopeLang = 'ru' | 'en';
export type HoroscopeFacet = 'warm' | 'even' | 'gentle';

export type DailyHoroscope = {
  sign: HoroscopeSign;
  day: string;
  text: string;
  question: string;
  facets: { love: HoroscopeFacet; work: HoroscopeFacet; energy: HoroscopeFacet };
};

const FACETS: HoroscopeFacet[] = ['warm', 'even', 'gentle'];

const SIGN_NAME_RU: Record<HoroscopeSign, string> = {
  aries: 'Овен', taurus: 'Телец', gemini: 'Близнецы', cancer: 'Рак', leo: 'Лев', virgo: 'Дева',
  libra: 'Весы', scorpio: 'Скорпион', sagittarius: 'Стрелец', capricorn: 'Козерог', aquarius: 'Водолей', pisces: 'Рыбы',
};

export function horoscopeCacheKey(day: string, sign: HoroscopeSign, lang: HoroscopeLang): string {
  return `${day}:${sign}:${lang}`;
}

/** Фаза Луны по среднему синодическому месяцу (точность около ±1 дня). */
export function moonPhaseName(date: Date, lang: HoroscopeLang): string {
  const SYNODIC = 29.530588853;
  const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);
  const age = ((((date.getTime() - REF_NEW_MOON_MS) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC;
  const idx = Math.floor(((age / SYNODIC) * 8 + 0.5) % 8);
  const ru = ['новолуние', 'растущая Луна (серп)', 'первая четверть', 'растущая Луна (почти полная)', 'полнолуние', 'убывающая Луна (почти полная)', 'последняя четверть', 'убывающая Луна (серп)'];
  const en = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'];
  return (lang === 'ru' ? ru : en)[idx];
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\r/g, '').trim() : '';
}

/**
 * Разбор ответа модели. Мусор (не JSON, пустой текст) → null: вызывающий берёт fallback.
 * Грани, которых нет в enum, заменяются на 'even'.
 */
export function parseHoroscopeModelOutput(raw: string | null | undefined): Omit<DailyHoroscope, 'sign' | 'day'> | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const text = cleanText(obj.text);
  const question = cleanText(obj.question);
  if (text.length < 40 || !question) return null;
  const facetsRaw = (obj.facets && typeof obj.facets === 'object' ? obj.facets : {}) as Record<string, unknown>;
  const facet = (v: unknown): HoroscopeFacet => (FACETS.includes(v as HoroscopeFacet) ? (v as HoroscopeFacet) : 'even');
  return {
    text,
    question,
    facets: { love: facet(facetsRaw.love), work: facet(facetsRaw.work), energy: facet(facetsRaw.energy) },
  };
}

/** Безопасный текст, если модель вернула мусор. */
export function fallbackHoroscope(sign: HoroscopeSign, day: string, lang: HoroscopeLang): DailyHoroscope {
  return lang === 'ru'
    ? {
        sign, day,
        text:
          `${SIGN_NAME_RU[sign]}: день располагает к спокойному наблюдению. Не нужно ничего решать наспех: заметь, что сегодня даётся легко, а что просит больше внимания.\n\n` +
          'Выбери одно небольшое дело и сделай его бережно, без спешки. Остальное подождёт.',
        question: 'Что сегодня поддержит меня по-настоящему?',
        facets: { love: 'even', work: 'even', energy: 'gentle' },
      }
    : {
        sign, day,
        text:
          `${sign.charAt(0).toUpperCase()}${sign.slice(1)}: today invites calm observation. There is no need to decide anything in a hurry: notice what comes easily and what asks for more attention.\n\n` +
          'Pick one small task and do it gently, without rushing. The rest can wait.',
        question: 'What would truly support me today?',
        facets: { love: 'even', work: 'even', energy: 'gentle' },
      };
}

const systemPrompt = (lang: HoroscopeLang) => `
Ты автор раздела «Гороскоп дня» в приложении Mindful Tarot. Пиши на языке: ${lang === 'ru' ? 'русском' : 'английском'}.
Обращайся к читателю на «ты» (по-английски — you), без обращений по полу.
Тон: спокойное наблюдение, тёплый и бережный. Без фатализма, без предсказаний событий, без процентов и чисел-вероятностей,
не используй слова «судьба», «рок», «плохо» (вместо этого «бережно», «требует внимания»).
Текст: 90-140 слов в 2-3 абзаца (абзацы разделяй пустой строкой), заканчивай мягким действием или вопросом к себе.
Верни ТОЛЬКО JSON: {"text": string, "question": string (одна фраза-вопрос к себе),
"facets": {"love": "warm"|"even"|"gentle", "work": "warm"|"even"|"gentle", "energy": "warm"|"even"|"gentle"}}.
`;

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/** Фабрика вызова модели подменяется в тестах. */
export type HoroscopeGenerator = (sign: HoroscopeSign, day: string, lang: HoroscopeLang) => Promise<DailyHoroscope>;

export const generateHoroscopeViaModel: HoroscopeGenerator = async (sign, day, lang) => {
  if (useMockOpenAi()) return mockGenerateHoroscope({ sign, day, lang });
  const phase = moonPhaseName(new Date(`${day}T12:00:00Z`), lang);
  const completion = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt(lang) },
      { role: 'user', content: `Знак: ${sign}. Дата: ${day}. Фаза Луны: ${phase}. Напиши гороскоп дня для этого знака.` },
    ],
  });
  const parsed = parseHoroscopeModelOutput(completion.choices[0]?.message?.content);
  return parsed ? { sign, day, ...parsed } : fallbackHoroscope(sign, day, lang);
};

const cache = new Map<string, Promise<DailyHoroscope>>();

/** Вычищает ключи прошлых дней. */
export function pruneHoroscopeCache(day: string): void {
  for (const key of cache.keys()) {
    if (!key.startsWith(`${day}:`)) cache.delete(key);
  }
}

export function resetHoroscopeCache(): void {
  cache.clear();
}

/**
 * Гороскоп знака на текущий день слота. Параллельные запросы делят один промис;
 * ошибка в кэше не остаётся.
 */
export function getDailyHoroscope(
  sign: HoroscopeSign,
  lang: HoroscopeLang,
  generate: HoroscopeGenerator = generateHoroscopeViaModel,
  now: Date = new Date()
): Promise<DailyHoroscope> {
  const day = tarotSlotDay(now);
  pruneHoroscopeCache(day);
  const key = horoscopeCacheKey(day, sign, lang);
  const hit = cache.get(key);
  if (hit) return hit;
  const promise = generate(sign, day, lang).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, promise);
  return promise;
}
