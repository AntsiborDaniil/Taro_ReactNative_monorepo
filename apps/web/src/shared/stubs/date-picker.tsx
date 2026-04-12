import React, { useEffect, useRef, useState } from 'react';

type DatePickerProps = {
  open?: boolean;
  date?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm?: (date: Date) => void;
  onCancel?: () => void;
  title?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  cancelText?: string;
  confirmText?: string;
};

const toInputValue = (d?: Date) => {
  if (!d || isNaN(d.getTime())) return '';
  return d.toISOString().substring(0, 10);
};

const blurActiveElement = () => {
  if (typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  active?.blur?.();
};

const DatePicker: React.FC<DatePickerProps> = ({
  open,
  date,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title = 'Выберите дату',
  cancelLabel = 'Отмена',
  confirmLabel = 'Готово',
  cancelText,
  confirmText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [val, setVal] = useState(toInputValue(date));
  const cancelBtn = cancelText ?? cancelLabel;
  const confirmBtn = confirmText ?? confirmLabel;

  useEffect(() => {
    if (open) {
      setVal(toInputValue(date));
      const t = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [open, date]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 15, 24, 0.72)',
        zIndex: 99999,
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          blurActiveElement();
          onCancel?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: '#1E232B',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minWidth: 300,
          maxWidth: 'calc(100vw - 32px)',
          border: '2px solid rgba(246, 192, 27, 0.45)',
        }}
      >
        <h2 style={{ margin: 0, color: '#F4F4F5', fontSize: 22 }}>{title}</h2>
        <input
          ref={inputRef}
          type="date"
          value={val}
          min={toInputValue(minimumDate)}
          max={toInputValue(maximumDate)}
          onChange={(e) => setVal(e.target.value)}
          style={{
            fontSize: 22,
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid rgba(246, 192, 27, 0.35)',
            color: '#F4F4F5',
            background: '#171F2C',
            colorScheme: 'dark',
          }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              blurActiveElement();
              onCancel?.();
            }}
          >
            {cancelBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              const selected = new Date(inputRef.current?.value ?? val);
              blurActiveElement();
              if (!isNaN(selected.getTime())) onConfirm?.(selected);
            }}
          >
            {confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
