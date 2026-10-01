import { useRef, type ReactElement } from 'react';
import styles from './VerifyCodeBoxes.module.css';

const CODE_LENGTH = 6;

export type VerifyCodeBoxesProps = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

/**
 * Перенос apps/web/src/pages/settings/ui/Auth/VerifyCodeBoxes.tsx на обычные
 * <input> (вместо RN TextInput) — 6 ячеек кода подтверждения email, ввод/
 * Backspace двигают фокус, поддержан paste всей строки.
 */
export function VerifyCodeBoxes({ value, onChange, disabled = false }: VerifyCodeBoxesProps): ReactElement {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? '');

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const applyDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join('').slice(0, CODE_LENGTH));
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      applyDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH).split('');
      const next = [...digits];
      pasted.forEach((ch, offset) => {
        if (index + offset < CODE_LENGTH) next[index + offset] = ch;
      });
      applyDigits(next);
      focusIndex(Math.min(index + pasted.length, CODE_LENGTH - 1));
      return;
    }

    const next = [...digits];
    next[index] = cleaned[0] ?? '';
    applyDigits(next);
    if (index < CODE_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (digits[index]) {
      const next = [...digits];
      next[index] = '';
      applyDigits(next);
      return;
    }
    if (index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      applyDigits(next);
      focusIndex(index - 1);
    }
  };

  return (
    <div className={styles.row}>
      {digits.map((digit, index) => (
        <div key={index} className={[styles.box, digit ? styles.filled : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ')}>
          <input
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            className={styles.input}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            disabled={disabled}
            aria-label={`Digit ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
