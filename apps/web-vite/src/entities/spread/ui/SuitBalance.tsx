import type { ComponentType, CSSProperties, ReactElement, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ArcanaMajorIcon, CupsIcon, PentaclesIcon, SwordsIcon, Text, WandsIcon } from '@shared/ui';
import { TAROT_SUITS, type TarotSuitKey } from '../model/suits';
import styles from './SuitBalance.module.css';

/** Цвета мастей — только токены DS (те же, что в Зеркале). */
export const SUIT_COLOR: Record<TarotSuitKey, string> = {
  major: 'var(--ds-accent-400)',
  cups: 'var(--ds-calm-500)',
  wands: 'var(--ds-action-500)',
  swords: 'var(--ds-ink-100)',
  pentacles: 'var(--ds-calm-600)',
};

export const SUIT_ICON: Record<TarotSuitKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  major: ArcanaMajorIcon,
  cups: CupsIcon,
  wands: WandsIcon,
  swords: SwordsIcon,
  pentacles: PentaclesIcon,
};

type SuitBalanceProps = {
  counts: Record<TarotSuitKey, number>;
  /** Легенда: иконка, название, тема масти и доля. */
  legend?: boolean;
  /** В легенде показывать число карт («2 из 6»), а не проценты. */
  absolute?: boolean;
};

/**
 * Баланс мастей: сегментная полоса (зазор 2px цвета ground900, чтобы соседние
 * цвета не сливались) + легенда с иконкой, темой масти и долей. Масти с нулём
 * в легенде приглушены — «отсутствующая масть» тоже информация.
 */
export function SuitBalance({ counts, legend = true, absolute = false }: SuitBalanceProps): ReactElement {
  const { t } = useTranslation();
  const total = TAROT_SUITS.reduce((sum, suit) => sum + counts[suit], 0);
  const pct = (suit: TarotSuitKey) => (total > 0 ? Math.round((counts[suit] / total) * 100) : 0);
  const summary = TAROT_SUITS.map((suit) => `${t(`spread:suits.${suit}`)} ${pct(suit)}%`).join(', ');

  return (
    <div className={styles.root}>
      <div className={styles.bar} role="img" aria-label={summary}>
        {TAROT_SUITS.filter((suit) => counts[suit] > 0).map((suit) => (
          <span
            key={suit}
            className={styles.segment}
            style={{ flexGrow: counts[suit], background: SUIT_COLOR[suit] } as CSSProperties}
          />
        ))}
      </div>
      {legend ? (
        <ul className={styles.legend}>
          {TAROT_SUITS.map((suit) => {
            const Icon = SUIT_ICON[suit];
            const empty = counts[suit] === 0;
            return (
              <li key={suit} className={[styles.row, empty ? styles.rowEmpty : ''].filter(Boolean).join(' ')}>
                <span className={styles.iconWrap} style={{ color: SUIT_COLOR[suit] }}>
                  <Icon width={20} height={20} aria-hidden="true" />
                </span>
                <span className={styles.text}>
                  <Text role="body" tone="ink50" as="span">
                    {t(`spread:suits.${suit}`)}
                  </Text>
                  <Text role="micro" tone="ink100" as="span">
                    {t(`spread:suits.theme.${suit}`)}
                  </Text>
                </span>
                <Text role="label" tone="ink100" as="span" className={styles.value}>
                  {absolute ? `${counts[suit]}/${total}` : `${pct(suit)}%`}
                </Text>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
