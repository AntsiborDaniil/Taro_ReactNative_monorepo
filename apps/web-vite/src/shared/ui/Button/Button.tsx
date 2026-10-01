import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'action' | 'quiet' | 'link';
export type ButtonQuietTone = 'accent' | 'neutral';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant;
  /** Цвет канта для variant="quiet". */
  quietTone?: ButtonQuietTone;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  children?: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  action: styles.action,
  quiet: styles.quiet,
  link: styles.link,
};

/**
 * DS-кнопка §11: action500 капсула / quiet ground600 / link.
 * Hover — плавная смена фона/цвета (без translateY и без underline).
 * Press — затемнение через ::after. loading — aria-busy + приглушённый текст.
 */
export function Button({
  variant = 'action',
  quietTone = 'neutral',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'start',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  const isDisabled = disabled || loading;

  const classes = [
    styles.base,
    VARIANT_CLASS[variant],
    variant === 'quiet' && quietTone === 'accent' ? styles.quietAccent : null,
    fullWidth ? styles.fullWidth : null,
    loading ? styles.loading : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon && iconPosition === 'start' ? <span className={styles.icon}>{icon}</span> : null}
      {children != null ? <span className={styles.label}>{children}</span> : null}
      {icon && iconPosition === 'end' ? <span className={styles.icon}>{icon}</span> : null}
    </button>
  );
}
