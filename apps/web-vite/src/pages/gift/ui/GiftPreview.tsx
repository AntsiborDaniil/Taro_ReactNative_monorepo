import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { Text } from '@shared/ui';
import type { GiftOccasion } from '@features/giftCard';
import styles from '../Gift.module.css';

type GiftPreviewProps = {
  recipientName: string;
  occasion: GiftOccasion;
  note: string;
  /** Подпись над превью («Так увидит открытку друг»). */
  caption?: string;
};

/** Мини-открытка: «Для {имя} · {повод}», записка и рубашка карты. Обновляется по мере ввода. */
export function GiftPreview({ recipientName, occasion, note, caption }: GiftPreviewProps): ReactElement {
  const { t } = useTranslation();
  const name = recipientName.trim();
  const occasionLabel = t(`together:gift.occasion.${occasion}`);
  const trimmedNote = note.trim();
  return (
    <section className={styles.previewBlock}>
      {caption ? (
        <Text role="micro" tone="ink100" className={styles.center}>
          {caption}
        </Text>
      ) : null}
      <div className={styles.postcard}>
        <span className={styles.postcardFace}>
          <TarotCardFace faceDown />
        </span>
        <div className={styles.postcardText}>
          <Text role="label" tone="accent">
            {name
              ? t('together:gift.preview.forNamed', { name, occasion: occasionLabel })
              : t('together:gift.preview.forAnon', { occasion: occasionLabel })}
          </Text>
          <Text role="body" tone={trimmedNote ? 'ink50' : 'ink100'} className={styles.postcardNote}>
            {trimmedNote ? `«${trimmedNote}»` : t('together:gift.preview.noteEmpty')}
          </Text>
        </div>
      </div>
    </section>
  );
}
