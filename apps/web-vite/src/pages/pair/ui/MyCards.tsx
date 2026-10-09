import type { ReactElement } from 'react';
import { TarotCardFace } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import type { PairCardDto } from '@features/pairReading';
import { Text } from '@shared/ui';
import styles from '../Pair.module.css';

type MyCardsProps = {
  cards: PairCardDto[];
  nameOf: (card: PairCardDto) => string;
  /** Рубашкой вверх (карты ещё не раскрыты). */
  faceDown?: boolean;
  /** Подписи позиций, когда у карт нет своих label (рубашки приглашения). */
  labels?: string[];
  /** Третья строка под подписью позиции (у рубашек — «ждём…»). */
  subCaption?: string;
};

/** Ряд из трёх карт с подписью позиции и именем карты (или subCaption у рубашек). */
export function MyCards({ cards, nameOf, faceDown = false, labels, subCaption }: MyCardsProps): ReactElement {
  return (
    <div className={styles.cards}>
      {cards.map((card, index) => (
        <div key={`${card.card_id ?? card.card}-${index}`} className={styles.cardItem}>
          <span className={faceDown ? `${styles.cardFace} ${styles.cardFaceDim}` : styles.cardFace}>
            <TarotCardFace
              cardId={card.card_id}
              direction={card.direction === 'reversed' ? TarotCardDirection.Reversed : TarotCardDirection.Upright}
              faceDown={faceDown}
            />
          </span>
          <Text role="micro" tone="ink100" className={styles.cardCaption}>
            {labels?.[index] ?? card.label}
          </Text>
          {faceDown ? (
            subCaption ? (
              <Text role="micro" tone="accent" className={styles.cardCaption}>
                {subCaption}
              </Text>
            ) : null
          ) : (
            <Text role="micro" tone="ink50" className={styles.cardCaption}>
              {nameOf(card)}
            </Text>
          )}
        </div>
      ))}
    </div>
  );
}
