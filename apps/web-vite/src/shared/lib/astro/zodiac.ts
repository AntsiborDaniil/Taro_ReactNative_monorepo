/**
 * Знаки зодиака, стихии и модальности — справочник без зависимостей
 * (можно импортировать на любом экране, движок с эфемеридами — отдельно, lazy).
 */
export const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;
export type ZodiacSign = (typeof SIGNS)[number];

export const SIGN_GLYPH: Record<ZodiacSign, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];
const MODALITIES: Modality[] = ['cardinal', 'fixed', 'mutable'];

export function elementOf(sign: ZodiacSign): Element {
  return ELEMENTS[SIGNS.indexOf(sign) % 4];
}

export function modalityOf(sign: ZodiacSign): Modality {
  return MODALITIES[SIGNS.indexOf(sign) % 3];
}

export function isZodiacSign(value: unknown): value is ZodiacSign {
  return typeof value === 'string' && (SIGNS as readonly string[]).includes(value);
}

/** Знак по эклиптической долготе (тропический зодиак). */
export function signOfLongitude(lon: number): { sign: ZodiacSign; degree: number } {
  const norm = ((lon % 360) + 360) % 360;
  return { sign: SIGNS[Math.floor(norm / 30)], degree: Math.floor(norm % 30) };
}

/**
 * Знак Солнца по дате без эфемерид — для мгновенного UI. На границах (19–23 число)
 * точный знак может зависеть от года и времени: движок это уточняет.
 */
const SIGN_START: Array<[number, number]> = [
  [3, 21], [4, 20], [5, 21], [6, 21], [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22], [1, 20], [2, 19],
];

export function sunSignByDate(month: number, day: number): ZodiacSign {
  for (let i = SIGNS.length - 1; i >= 0; i -= 1) {
    const [m, d] = SIGN_START[i];
    const [nm, nd] = SIGN_START[(i + 1) % 12];
    const afterStart = month === m && day >= d;
    const beforeNext = month === nm && day < nd;
    if (afterStart || beforeNext) return SIGNS[i];
  }
  return 'capricorn';
}
