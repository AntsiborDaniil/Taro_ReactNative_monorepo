import { useId, type InputHTMLAttributes, type ReactElement } from 'react';
import styles from './Switch.module.css';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  id?: string;
  label?: string;
};

/** DS-переключатель: трек ground600 / calm600 вкл, бегунок ink50. */
export function Switch({ id, label, disabled, className, ...rest }: SwitchProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={[styles.wrapper, disabled ? styles.disabled : null, className].filter(Boolean).join(' ')}
    >
      <input id={inputId} type="checkbox" className={styles.input} disabled={disabled} {...rest} />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
}
