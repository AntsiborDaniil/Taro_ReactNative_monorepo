import { SpreadName } from '@legacy-data';

/**
 * state навигации на /card/:id из расклада: там карта уже прочитана в позиции,
 * учебные блоки (ключевые слова, совет, значения по раскладам) не показываем.
 */
export const CARD_FROM_SPREAD_STATE = { fromSpread: true } as const;

export function isCardOpenedFromSpread(state: unknown): boolean {
  return Boolean(state && typeof state === 'object' && (state as { fromSpread?: unknown }).fromSpread);
}

export type CardStudySpread = {
  id: SpreadName;
  /** i18n-ключ названия (spread:*). */
  nameKey: string;
  /**
   * Число позиций с текстом в card.json (`<cardId>.meaning.<dir>.<spreadId>.<i>`).
   * 0 — у расклада одна карта: показываем только первый текст без подписи позиции.
   */
  positions: number;
};

export type CardStudyGroup = {
  id: 'love' | 'work' | 'self' | 'choice' | 'general' | 'quick';
  spreads: CardStudySpread[];
};

const spread = (id: SpreadName, positions: number, nameKey = `spread:${id}.name`): CardStudySpread => ({
  id,
  nameKey,
  positions,
});

/** Расклады, для которых в card.json есть значения карты по позициям. */
export const CARD_STUDY_GROUPS: CardStudyGroup[] = [
  {
    id: 'love',
    spreads: [spread(SpreadName.Thematic_Love, 6), spread(SpreadName.Thematic_Relationship, 6)],
  },
  { id: 'work', spreads: [spread(SpreadName.Thematic_CareerFinance, 9)] },
  {
    id: 'self',
    spreads: [spread(SpreadName.SelfDevelopment_Mirror, 10), spread(SpreadName.SelfDevelopment_ShadowSide, 5)],
  },
  {
    id: 'choice',
    spreads: [spread(SpreadName.Choice_TwoPaths, 7), spread(SpreadName.Choice_Crossroad, 9)],
  },
  {
    id: 'general',
    spreads: [
      spread(SpreadName.Universal_CelticCross, 10),
      spread(SpreadName.Universal_Pyramid, 10),
      spread(SpreadName.Universal_Horseshoe, 7),
      spread(SpreadName.Universal_Flame, 12),
    ],
  },
  {
    id: 'quick',
    spreads: [
      spread(SpreadName.Simple_DaySuggest, 0, 'spread:daySuggest.name'),
      spread(SpreadName.Simple_YesNo, 0, 'spread:yesNo.name'),
    ],
  },
];

/** Подписи позиций в spread.json идут с кириллической «с» в «сardMeaning». */
export function cardStudyPositionLabelKey(spreadId: SpreadName, index: number): string {
  return `spread:${spreadId}.сardMeaning.${index}`;
}
