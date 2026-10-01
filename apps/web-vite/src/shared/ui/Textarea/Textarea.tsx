import { useId, type ReactElement, type TextareaHTMLAttributes } from 'react';
import fieldStyles from '../Input/Input.module.css';
import styles from './Textarea.module.css';

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
};

/** DS-поле §11 (многострочное): та же оправа, что у Input, резинится по высоте. */
export function Textarea({
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
}: TextareaProps): ReactElement {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);
  const length =
    typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={fieldStyles.wrapper}>
      {label ? (
        <label className={fieldStyles.label} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div className={hasError ? `${fieldStyles.fieldWrap} ${fieldStyles.error}` : fieldStyles.fieldWrap}>
        <textarea
          id={fieldId}
          className={`${styles.textarea} ${className ?? ''}`.trim()}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {hint || hasError || (showCount && maxLength) ? (
        <div className={fieldStyles.footer}>
          <div>
            {hasError ? (
              <p id={errorId} className={fieldStyles.errorText}>
                {error}
              </p>
            ) : hint ? (
              <p id={hintId} className={fieldStyles.hint}>
                {hint}
              </p>
            ) : null}
          </div>
          {showCount && maxLength ? (
            <span className={fieldStyles.count}>
              {length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
