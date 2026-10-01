import type { ReactElement } from 'react';
import { TarotCardDirection } from '@legacy-data';
import { getImage, DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { useAppSelector } from '@shared/lib/store';
import { SmartImage } from '@shared/ui';
import styles from './TarotCardFace.module.css';

export type TarotCardFaceProps = {
  /** Числовой id карты (0..77) как строка. Пусто/undefined — рубашка (face-down). */
  cardId?: string;
  direction?: TarotCardDirection;
  faceDown?: boolean;
  className?: string;
  /** Переопределить стиль колоды (по умолчанию — из entities/settings, см. /settings/deck). */
  deckStyle?: string;
};

/**
 * Перенос визуала apps/web/src/shared/ui/TarotCard/TarotCard.tsx (без UI Kitten/
 * Animated) — карточка 9:16, перевёрнутая карта = rotate(180deg). Рубашка —
 * core/cardBack, как и в старом коде. Стиль колоды читается напрямую из
 * стора (state.settings, а не entities/settings — чтобы не тянуть entity→entity
 * импорт) — так все существующие места рендера карты подхватывают настройку
 * без изменений на вызывающей стороне.
 */
export function TarotCardFace({ cardId, direction, faceDown, className, deckStyle }: TarotCardFaceProps): ReactElement {
  const settingsDeckStyle = useAppSelector((state) => state.settings.settings.appearance?.deckStyle);
  const resolvedDeckStyle = deckStyle ?? settingsDeckStyle ?? DECK_STYLE_FLAT;

  const cardBack = getImage(['core', 'cardBack']);
  const img = faceDown || !cardId
    ? cardBack
    : getImage(['tarotCards', resolvedDeckStyle, `card${cardId}`]) || cardBack;

  const rotated = !faceDown && direction === TarotCardDirection.Reversed;

  return (
    <span className={[styles.card, className].filter(Boolean).join(' ')}>
      <span className={styles.inner}>
        <SmartImage
          className={styles.image}
          src={img}
          fallbackSrc={cardBack}
          style={rotated ? { transform: 'rotate(180deg)' } : undefined}
        />
      </span>
    </span>
  );
}
