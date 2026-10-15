import type { ReactElement } from 'react';
import styles from './MoonPhaseIcon.module.css';

export type MoonPhaseIconProps = {
  /** Освещённая доля диска, 0–100. */
  illumination: number;
  /** Растущая Луна подсвечена справа, убывающая — слева. */
  waxing: boolean;
  size?: number;
  className?: string;
  title?: string;
};

const R = 10;
const C = 12;

/** Путь освещённой части: внешняя дуга лимба + дуга терминатора (эллипс). */
function litPath(fraction: number, waxing: boolean): string | null {
  if (fraction <= 0.02) return null;
  const rx = Math.abs(1 - 2 * fraction) * R;
  const limbSweep = waxing ? 1 : 0;
  const crescent = fraction < 0.5;
  const termSweep = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M ${C} ${C - R} A ${R} ${R} 0 0 ${limbSweep} ${C} ${C + R} A ${rx} ${R} 0 0 ${termSweep} ${C} ${C - R} Z`;
}

/** Фаза Луны SVG-иконкой по освещённости и направлению роста (цвета — токены мира). */
export function MoonPhaseIcon({ illumination, waxing, size = 28, className, title }: MoonPhaseIconProps): ReactElement {
  const fraction = Math.min(1, Math.max(0, illumination / 100));
  const path = fraction >= 0.98 ? null : litPath(fraction, waxing);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={[styles.icon, className].filter(Boolean).join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle cx={C} cy={C} r={R} className={styles.dark} />
      {fraction >= 0.98 ? <circle cx={C} cy={C} r={R} className={styles.lit} /> : null}
      {path ? <path d={path} className={styles.lit} /> : null}
      <circle cx={C} cy={C} r={R} className={styles.rim} />
    </svg>
  );
}
