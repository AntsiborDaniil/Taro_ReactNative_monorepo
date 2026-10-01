import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../Icon';
import styles from './ListRow.module.css';

export type ListRowProps = {
  leadingIcon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Кастомный трейлинг-слот (переключатель и т.п.); по умолчанию — шеврон, если есть `to`/`onClick`. */
  trailing?: ReactNode;
  selected?: boolean;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/** DS-строка списка §11: h64, r18, ground700/ground600, selected — полоса 5px accent400 слева. */
export function ListRow({
  leadingIcon,
  title,
  subtitle,
  trailing,
  selected = false,
  to,
  onClick,
  disabled = false,
  className,
  ...rest
}: ListRowProps): ReactElement {
  const interactive = Boolean(to || onClick);
  const classes = [
    styles.row,
    interactive ? styles.interactive : null,
    selected ? styles.selected : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leadingIcon ? <span className={styles.leading}>{leadingIcon}</span> : null}
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </span>
      <span className={styles.trailing}>
        {trailing ?? (interactive ? <ChevronRightIcon width={20} height={20} /> : null)}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-current={selected ? 'true' : undefined} {...rest}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={disabled} {...rest}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} {...rest}>
      {content}
    </div>
  );
}
