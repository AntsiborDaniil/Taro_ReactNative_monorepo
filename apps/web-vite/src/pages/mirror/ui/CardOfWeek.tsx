import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import { Text } from '@shared/ui';
import type { MirrorFrequentCard } from '../model/computeMirror';
import styles from '../Mirror.module.css';

type CardOfWeekProps = {
  card: MirrorFrequentCard;
  /** Заголовок блока (по умолчанию «Карта недели»). */
  title?: string;
  /** Подпись под названием карты; по умолчанию — «выпала N раз» / «свежий Старший аркан». */
  caption?: string;
  direction?: string;
  /** Остальные повторявшиеся карты (≥2), кроме карты недели. */
  repeats: MirrorFrequentCard[];
  /** card.json загружен — можно показывать названия и ключевые слова. */
  namesReady: boolean;
};

/** «Карта недели»: самая частая (или свежий Старший аркан) крупно + ключевые слова + другие повторы. */
export function CardOfWeek({ card, repeats, namesReady, title, caption, direction }: CardOfWeekProps): ReactElement {
  const { t, i18n } = useTranslation();
  const name = (id: string) => (namesReady ? t(`card:${id}.name`) : t('core:card'));
  const keywordsKey = `card:${card.cardId}.keywords.upright.default.0`;
  const keywords = namesReady && i18n.exists(keywordsKey) ? t(keywordsKey) : '';

  return (
    <section className={styles.section}>
      <Text role="label" tone="accent" as="h2" className={styles.sectionTitle}>
        {title ?? t('main:mirror.cardOfWeek.title')}
      </Text>
      <Link to={`/card/${card.cardId}`} className={styles.weekCard}>
        <span className={styles.weekCardFace}>
          <TarotCardFace
            cardId={card.cardId}
            direction={direction === TarotCardDirection.Reversed ? TarotCardDirection.Reversed : undefined}
          />
        </span>
        <span className={styles.weekCardText}>
          <Text role="title" tone="ink50" as="span">
            {name(card.cardId)}
          </Text>
          <Text role="micro" tone="accent" as="span">
            {caption ??
              (card.count >= 2
                ? t('main:mirror.cardOfWeek.repeated', { count: card.count })
                : t('main:mirror.cardOfWeek.fresh'))}
          </Text>
          {keywords ? (
            <Text role="body" tone="ink100" as="span">
              {keywords}
            </Text>
          ) : null}
        </span>
      </Link>
      {repeats.length > 0 ? (
        <div className={styles.repeatRow}>
          <Text role="micro" tone="ink100" as="span">
            {t('main:mirror.cardOfWeek.alsoRepeated')}
          </Text>
          {repeats.map((r) => (
            <Link key={r.cardId} to={`/card/${r.cardId}`} className={styles.repeatChip}>
              {name(r.cardId)} ×{r.count}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
