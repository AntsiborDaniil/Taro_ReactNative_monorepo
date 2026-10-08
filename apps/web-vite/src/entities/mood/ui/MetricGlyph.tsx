import type { ReactElement } from 'react';

type MetricGlyphProps = {
  metric: 'mood' | 'energy' | 'stress';
  /** 0–10; null — значение ещё не выставлено (нейтральная форма). */
  value: number | null;
  size?: number;
};

/**
 * «Живая» иконка метрики, меняется вместе с ползунком (currentColor):
 * настроение — лицо, улыбка гнётся от грусти к радости; энергия — батарея
 * заполняется; стресс — волна, амплитуда растёт с напряжением.
 */
export function MetricGlyph({ metric, value, size = 28 }: MetricGlyphProps): ReactElement {
  const v = value ?? 5;
  const k = v / 10;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (metric === 'mood') {
    // Контрольная точка рта: 13 (грусть) → 19 (улыбка).
    const mouthCtrl = 13 + k * 6;
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
        <path d={`M8 15.5 Q12 ${mouthCtrl} 16 15.5`} />
      </svg>
    );
  }

  if (metric === 'energy') {
    const width = Math.max(0.6, 13 * k);
    return (
      <svg {...common}>
        <rect x="3" y="7" width="16" height="10" rx="2.5" />
        <path d="M21.5 10.5v3" />
        <rect x="4.5" y="8.5" width={width} height="7" rx="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  // stress: волна, амплитуда 0.5 → 5.
  const amp = 0.5 + k * 4.5;
  return (
    <svg {...common}>
      <path d={`M3 12 Q5.25 ${12 - amp} 7.5 12 T12 12 T16.5 12 T21 12`} />
    </svg>
  );
}
