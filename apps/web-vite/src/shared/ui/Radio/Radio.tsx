import { useId, type ReactElement } from 'react';
import styles from './Radio.module.css';

export type RadioProps = {
  checked?: boolean;
  onChange?: () => void;
  label?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/** DS-радио: круг ground600 → accent400 (кант + точка) при выборе. */
export function Radio({ checked, onChange, label, name, value, disabled, id, className }: RadioProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={[styles.wrapper, disabled ? styles.disabled : null, className].filter(Boolean).join(' ')}
    >
      <input
        id={inputId}
        type="radio"
        className={styles.input}
        checked={checked}
        onChange={onChange}
        name={name}
        value={value}
        disabled={disabled}
      />
      <span className={styles.circle}>
        <span className={styles.dot} />
      </span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
}

export type RadioGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioGroupOption[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

export function RadioGroup({ name, value, onChange, options, orientation = 'vertical', className }: RadioGroupProps): ReactElement {
  return (
    <div
      role="radiogroup"
      className={[styles.group, orientation === 'horizontal' ? styles.groupHorizontal : null, className]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          disabled={option.disabled}
          onChange={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}
