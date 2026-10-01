import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  selected?: boolean;
  children?: ReactNode;
};

/** DS-чип §11: капсула h40, Onest 700 15 капс, selected — calm600 + кант accent400. */
export function Chip({ selected = false, className, type = 'button', ...rest }: ChipProps): ReactElement {
  const classes = [styles.chip, selected ? styles.selected : null, className].filter(Boolean).join(' ');

  return <button type={type} className={classes} aria-pressed={selected} {...rest} />;
}
