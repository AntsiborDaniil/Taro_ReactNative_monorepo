import {
  SpreadName,
  TarotCardDirection,
  TSelectedTarotCard,
  TTarotCard,
  TTarotCardSelectedRandomTexts,
  TTarotCardTexts,
} from 'shared/api';
import { getRandomElementFromArray } from '../random';

export const DIRECTIONS = [
  TarotCardDirection.Upright,
  TarotCardDirection.Upright,
  TarotCardDirection.Upright,
  TarotCardDirection.Reversed,
];

const RANDOM_CARD_KEYS: (keyof TTarotCardTexts)[] = [
  'advice',
  'description',
  'meaning',
  'keywords',
  'yesNo',
];

const SIMPLE_SPREADS = [SpreadName.Simple_YesNo, SpreadName.Simple_DaySuggest];

export function getTarotCardReadings({
  card,
  spreadId = SpreadName.Default,
  index = 0,
  direction,
  keys = RANDOM_CARD_KEYS,
}: {
  card: TTarotCard;
  spreadId?: SpreadName | null;
  index?: number;
  direction?: TarotCardDirection;
  keys?: (keyof TTarotCardTexts)[];
}): TSelectedTarotCard {
  const selectedDirection = direction || getRandomElementFromArray(DIRECTIONS);

  const randomTexts = keys.reduce(
    (acc: TTarotCardSelectedRandomTexts, currentValue) => {
      const firstLevelSelect = card[currentValue]?.[selectedDirection];

      if (currentValue === 'yesNo') {
        return {
          ...acc,
          yesNo: `card:${card.id}.yesNo.${selectedDirection}.0`,
        };
      }

      if (Array.isArray(firstLevelSelect)) {
        const value = firstLevelSelect[0];

        return { ...acc, [currentValue]: value ?? '' };
      }

      if (typeof firstLevelSelect === 'string') {
        return { ...acc, [currentValue]: firstLevelSelect ?? '' };
      }

      if (firstLevelSelect[spreadId ?? SpreadName.Default]) {
        let selectedIndex = index;

        if (
          currentValue === 'advice' ||
          (spreadId && SIMPLE_SPREADS.includes(spreadId))
        ) {
          selectedIndex = 0;
        }

        const value =
          firstLevelSelect[spreadId ?? SpreadName.Default][selectedIndex];

        return { ...acc, [currentValue]: value ?? '' };
      }

      return acc;
    },
    {
      advice: '',
      description: '',
      keywords: '',
      meaning: '',
      yesNo: '',
    }
  );

  return {
    ...card,
    ...randomTexts,
    direction: selectedDirection,
  };
}
