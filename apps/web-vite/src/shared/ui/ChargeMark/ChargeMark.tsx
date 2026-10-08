import type { ReactElement } from 'react';
import { LightningIcon } from '../Icon';
import styles from './ChargeMark.module.css';

export type ChargeMarkProps = {
  /** Сколько зарядов стоит действие. Число рисуется только при cost > 1 («⚡2»). */
  cost?: number;
  size?: 'xs' | 'sm' | 'md';
  /** Внутри кнопки variant="action": цвет текста кнопки вместо янтаря. */
  onAction?: boolean;
  /** Кружок-подложка для размещения поверх картинки (каталог, карусель). */
  overlay?: boolean;
  className?: string;
};

/**
 * Ценник «⚡»: помечает контент, который тратит заряды. Бесплатное (карта дня,
 * настроение, зеркало) не помечается вообще — без плашек «Бесплатно».
 * Тот же янтарь, что у молнии CreditsBadge в шапке: кошелёк и ценник читаются
 * как одна валюта, но ценник всегда меньше. Декоративный — подпись для
 * скринридера даёт родитель (core:charge.a11y).
 */
export function ChargeMark({
  cost = 1,
  size = 'sm',
  onAction = false,
  overlay = false,
  className,
}: ChargeMarkProps): ReactElement {
  const classes = [
    styles.root,
    styles[size],
    onAction ? styles.onAction : null,
    overlay ? styles.overlay : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true">
      <LightningIcon className={styles.icon} />
      {cost > 1 ? <span className={styles.count}>{cost}</span> : null}
    </span>
  );
}
