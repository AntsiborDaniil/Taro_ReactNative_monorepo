import type { Planet } from '@shared/lib/astro/engine';
import type { ZodiacSign } from '@shared/lib/astro';

/** ︎ — принудительно текстовый глиф, без цветного эмодзи. */
const TEXT = '︎';

export const PLANET_GLYPH: Record<Planet, string> = {
  sun: `☉${TEXT}`,
  moon: `☽${TEXT}`,
  mercury: `☿${TEXT}`,
  venus: `♀${TEXT}`,
  mars: `♂${TEXT}`,
  jupiter: `♃${TEXT}`,
  saturn: `♄${TEXT}`,
  uranus: `♅${TEXT}`,
  neptune: `♆${TEXT}`,
  pluto: `♇${TEXT}`,
};

export const signGlyph = (glyph: string): string => `${glyph}${TEXT}`;

/** Карта Старшего аркана знака по Золотой Заре (id в cardsData / роут /card/:id). */
export const SIGN_TAROT_CARD_ID: Record<ZodiacSign, number> = {
  aries: 4,
  taurus: 5,
  gemini: 6,
  cancer: 7,
  leo: 8,
  virgo: 9,
  libra: 11,
  scorpio: 13,
  sagittarius: 14,
  capricorn: 15,
  aquarius: 17,
  pisces: 18,
};
