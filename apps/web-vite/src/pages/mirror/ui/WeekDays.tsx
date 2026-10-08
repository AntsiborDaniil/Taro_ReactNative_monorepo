import { useMemo, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import { Text } from '@shared/ui';
import type { MirrorDay } from '../model/computeMirror';
import styles from '../Mirror.module.css';

const METRICS = ['mood', 'energy', 'stress'] as const;
/** Больше — сворачиваем в «+N», иначе день с десятком раскладов растягивает экран. */
const MAX_DAY_CARDS = 12;

/**
 * «Дни недели»: все карты каждого дня (а не только частые) и отметка
 * состояния того же дня — так видно связь карт и самочувствия даже на паре отметок.
 */
export function WeekDays({ days }: { days: MirrorDay[] }): ReactElement {
  const { t, i18n } = useTranslation();
  const fmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }),
    [i18n.language],
  );

  return (
    <section className={styles.section}>
      <Text role="label" tone="accent" as="h2" className={styles.sectionTitle}>
        {t('main:mirror.days.title')}
      </Text>
      <ol className={styles.days}>
        {days.map((day) => (
          <li key={day.day} className={styles.dayRow}>
            <Text role="micro" tone="ink100" as="span" className={styles.dayDate}>
              {fmt.format(day.date)}
            </Text>
            {day.cards.length > 0 ? (
              <div className={styles.dayCards}>
                {day.cards.slice(0, MAX_DAY_CARDS).map((card, index) => (
                  <Link key={`${card.id}-${index}`} to={`/card/${card.id}`} className={styles.dayCard}>
                    <TarotCardFace
                      cardId={card.id}
                      direction={card.direction === 'reversed' ? TarotCardDirection.Reversed : TarotCardDirection.Upright}
                    />
                  </Link>
                ))}
                {day.cards.length > MAX_DAY_CARDS ? (
                  <span className={styles.dayMore} aria-label={t('main:mirror.days.more', { count: day.cards.length - MAX_DAY_CARDS })}>
                    +{day.cards.length - MAX_DAY_CARDS}
                  </span>
                ) : null}
              </div>
            ) : (
              <Text role="micro" tone="ink100" as="span">
                {t('main:mirror.days.noCards')}
              </Text>
            )}
            {day.mood ? (
              <div className={styles.dayMood}>
                {METRICS.filter((m) => day.mood?.[m] != null).map((m) => (
                  <span key={m} className={styles.moodChip}>
                    {t(`main:mirror.metricShort.${m}`)} {day.mood?.[m]}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
