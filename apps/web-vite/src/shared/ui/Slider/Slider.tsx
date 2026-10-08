import { useId, type CSSProperties, type ReactElement } from 'react';
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
  /** Цвет заполнения и бегунка (токен DS). По умолчанию accent400. */
  tone?: 'accent' | 'calm' | 'action';
  /** Без шапки (подпись/значение рисует родитель); label уходит в aria-label. */
  compact?: boolean;
};

const TONE_VAR: Record<NonNullable<SliderProps['tone']>, string> = {
  accent: 'var(--ds-accent-400)',
  calm: 'var(--ds-calm-500)',
  action: 'var(--ds-action-500)',
};

/** DS-слайдер: трек ground600, заполнение и бегунок — tone (accent400 по умолчанию). */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  unset = false,
  disabled,
  tone = 'accent',
  compact = false,
}: SliderProps): ReactElement {
  const id = useId();
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const display = unset ? '—' : String(value % 1 === 0 ? value : value.toFixed(1));

  const color = TONE_VAR[tone];

  return (
    <div className={styles.wrapper} style={{ '--slider-color': color } as CSSProperties}>
      {compact ? null : (
      <div className={styles.head}>
        <div>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
        </div>
        <span className={unset ? `${styles.value} ${styles.valueUnset}` : styles.value}>{display}</span>
      </div>
      )}
      <input
        id={id}
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={compact ? label : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} ${percent}%, var(--ds-ground-600) ${percent}%)`,
        }}
      />
      {compact ? null : (
        <div className={styles.scaleRow}>
          <span className={styles.scaleEdge}>{min}</span>
          <span className={styles.scaleEdge}>{max}</span>
        </div>
      )}
    </div>
  );
}
