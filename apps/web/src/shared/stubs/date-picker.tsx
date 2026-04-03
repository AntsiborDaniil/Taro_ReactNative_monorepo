import React from 'react';

type DatePickerProps = {
  modal?: boolean;
  open?: boolean;
  date?: Date;
  mode?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm?: (date: Date) => void;
  onCancel?: () => void;
  [key: string]: unknown;
};

const DatePicker: React.FC<DatePickerProps> = ({
  open,
  date,
  onConfirm,
  onCancel,
  minimumDate,
}) => {
  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = new Date(e.target.value);
    if (!isNaN(selected.getTime())) {
      onConfirm?.(selected);
    }
  };

  const toInputValue = (d?: Date) => {
    if (!d || isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: '#1a2233',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minWidth: 280,
        }}
      >
        <input
          type="date"
          defaultValue={toInputValue(date)}
          min={toInputValue(minimumDate)}
          onChange={handleChange}
          style={{
            fontSize: 18,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            outline: 'none',
            colorScheme: 'dark',
          }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #666',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
