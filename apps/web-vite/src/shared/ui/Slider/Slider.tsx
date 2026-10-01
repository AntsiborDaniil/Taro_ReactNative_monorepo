import { useId, type ReactElement } from 'react';
import styles from './Slider.module.css';

export type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
  /** Значение ещё не выставлено — показываем прочерк вместо числа. */
  unset?: boolean;
  disabled?: boolean;
};

/** DS-слайдер: трек ground600, заполнение accent400, бегунок accent400. */
export function Slider({ label, value, min, max, step = 1, onChange, hint, unset = false, disabled }: SliderProps): ReactElement {
  const id = useId();
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const display = unset ? '—' : String(value % 1 === 0 ? value : value.toFixed(1));

  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <div>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
        </div>
        <span className={unset ? `${styles.value} ${styles.valueUnset}` : styles.value}>{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, var(--ds-accent-400) ${percent}%, var(--ds-ground-600) ${percent}%)`,
        }}
      />
      <div className={styles.scaleRow}>
        <span className={styles.scaleEdge}>{min}</span>
        <span className={styles.scaleEdge}>{max}</span>
      </div>
    </div>
  );
}
