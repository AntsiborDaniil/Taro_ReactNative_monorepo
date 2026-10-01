import type { ComponentType, ReactElement } from 'react';
import type { IconProps } from '@shared/ui';
import styles from './SuitItem.module.css';

export type SuitItemProps = {
  Icon: ComponentType<IconProps>;
  selected: boolean;
  onClick: () => void;
  label: string;
};

/** Чип-фильтр раздела словаря (круглый): выбранный — calm600 + кант accent400. */
export function SuitItem({ Icon, selected, onClick, label }: SuitItemProps): ReactElement {
  return (
    <button
      type="button"
      className={[styles.item, selected ? styles.selected : null].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
    >
      <Icon width={26} height={26} className={styles.icon} />
    </button>
  );
}
