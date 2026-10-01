import { useId, type InputHTMLAttributes, type ReactElement } from 'react';
import styles from './Input.module.css';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
};

/** DS-поле §11: h74, r24, рамка 1.6 → 2.4 calm500 в фокусе, ошибка alarm600 под полем. */
export function Input({
  id,
  label,
  hint,
  error,
  showCount = false,
  maxLength,
  className,
  value,
  defaultValue,
  ...rest
}: InputProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);
  const length = typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className={hasError ? `${styles.fieldWrap} ${styles.error}` : styles.fieldWrap}>
        <input
          id={inputId}
          className={`${styles.input} ${className ?? ''}`.trim()}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {hint || hasError || (showCount && maxLength) ? (
        <div className={styles.footer}>
          <div>
            {hasError ? (
              <p id={errorId} className={styles.errorText}>
                {error}
              </p>
            ) : hint ? (
              <p id={hintId} className={styles.hint}>
                {hint}
              </p>
            ) : null}
          </div>
          {showCount && maxLength ? (
            <span className={styles.count}>
              {length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
