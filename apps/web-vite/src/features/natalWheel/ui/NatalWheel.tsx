import { useMemo, type ReactElement } from 'react';
import { SIGNS, SIGN_GLYPH } from '@shared/lib/astro';
import type { NatalChart } from '@shared/lib/astro/engine';
import { computeAspects, polarPoint, spreadLongitudes } from '../lib/geometry';
import { PLANET_GLYPH, signGlyph } from '../lib/planets';
import styles from './NatalWheel.module.css';

export type NatalWheelProps = {
  chart: NatalChart;
  selected: string | null;
  onSelect: (planet: string | null) => void;
  /** Подпись центра: знаки большой тройки. */
  centerLines: { title: string; subtitle: string };
  ariaLabel: string;
};

const R_OUT = 146;
const R_SIGN = 118;
const R_IN = 66;
const R_PLANET = 96;
const R_ASPECT = 62;

/** SVG-колесо без библиотек: знаки, дома Whole Sign, планеты, аспекты. */
export function NatalWheel({ chart, selected, onSelect, centerLines, ariaLabel }: NatalWheelProps): ReactElement {
  const hasHouses = chart.asc != null;
  const ref = chart.asc?.lon ?? 0;
  const pt = (lon: number, r: number) => polarPoint(lon, ref, r);

  const bodies = useMemo(() => chart.planets.map((p) => ({ id: p.planet, lon: p.lon })), [chart]);
  const aspects = useMemo(() => computeAspects(bodies), [bodies]);
  const shown = useMemo(() => spreadLongitudes(bodies, 10), [bodies]);

  const ascSign = chart.asc ? Math.floor(chart.asc.lon / 30) : 0;

  return (
    <svg className={styles.svg} viewBox="-150 -150 300 300" role="img" aria-label={ariaLabel} onClick={() => onSelect(null)}>
      <circle r={R_OUT} className={styles.disc} />
      <circle r={R_SIGN} className={styles.ring} />
      <circle r={R_IN} className={styles.center} />

      {SIGNS.map((sign, i) => {
        const a = pt(i * 30, R_OUT);
        const b = pt(i * 30, R_SIGN);
        const g = pt(i * 30 + 15, (R_OUT + R_SIGN) / 2);
        return (
          <g key={sign}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.tick} />
            <text x={g.x} y={g.y} className={styles.signGlyph} textAnchor="middle" dominantBaseline="central">
              {signGlyph(SIGN_GLYPH[sign])}
            </text>
          </g>
        );
      })}

      {hasHouses
        ? Array.from({ length: 12 }, (_, i) => {
            const lon = (((ascSign + i) % 12) * 30);
            const a = pt(lon, R_SIGN);
            const b = pt(lon, R_IN);
            const num = pt(lon + 15, R_IN + 9);
            return (
              <g key={`h${i}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.houseLine} />
                <text x={num.x} y={num.y} className={styles.houseNum} textAnchor="middle" dominantBaseline="central">
                  {i + 1}
                </text>
              </g>
            );
          })
        : null}

      {chart.asc ? <Axis lon={chart.asc.lon} ref={ref} label="ASC" labelAt={pt(chart.asc.lon, R_OUT + 2)} dx={-4} /> : null}
      {chart.mc ? <Axis lon={chart.mc.lon} ref={ref} label="MC" labelAt={pt(chart.mc.lon, R_OUT + 2)} dx={0} /> : null}

      {aspects.map((asp) => {
        const lonA = chart.planets.find((p) => p.planet === asp.a)?.lon ?? 0;
        const lonB = chart.planets.find((p) => p.planet === asp.b)?.lon ?? 0;
        const a = pt(lonA, R_ASPECT);
        const b = pt(lonB, R_ASPECT);
        const dim = selected != null && asp.a !== selected && asp.b !== selected;
        return (
          <line
            key={`${asp.a}-${asp.b}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={asp.tense ? styles.aspectTense : styles.aspectCalm}
            style={{ opacity: dim ? 0.12 : 0.8 }}
          />
        );
      })}

      {chart.planets.map((p) => {
        const real = pt(p.lon, R_SIGN);
        const real2 = pt(p.lon, R_SIGN - 5);
        const spot = pt(shown[p.planet] ?? p.lon, R_PLANET);
        const dim = selected != null && selected !== p.planet && !aspects.some((a) => (a.a === selected && a.b === p.planet) || (a.b === selected && a.a === p.planet));
        const main = p.planet === 'sun' || p.planet === 'moon';
        return (
          <g
            key={p.planet}
            className={styles.planet}
            style={{ opacity: dim ? 0.3 : 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(selected === p.planet ? null : p.planet);
            }}
          >
            <line x1={real.x} y1={real.y} x2={real2.x} y2={real2.y} className={styles.dotLine} />
            <circle cx={spot.x} cy={spot.y} r={10} className={main ? styles.bubbleMain : styles.bubble} data-selected={selected === p.planet || undefined} />
            <text x={spot.x} y={spot.y} className={styles.planetGlyph} textAnchor="middle" dominantBaseline="central">
              {PLANET_GLYPH[p.planet]}
            </text>
          </g>
        );
      })}

      <text x={0} y={-4} className={styles.centerTitle} textAnchor="middle">
        {centerLines.title}
      </text>
      <text x={0} y={13} className={styles.centerSub} textAnchor="middle">
        {centerLines.subtitle}
      </text>
    </svg>
  );
}

/** Ось: два отрезка в кольце домов (у лонготы и напротив), центр не пересекает. */
function Axis({
  lon,
  ref,
  label,
  labelAt,
  dx,
}: {
  lon: number;
  ref: number;
  label: string;
  labelAt: { x: number; y: number };
  dx: number;
}): ReactElement {
  return (
    <g>
      {[lon, lon + 180].map((l) => {
        const a = polarPoint(l, ref, R_SIGN);
        const b = polarPoint(l, ref, R_IN);
        return <line key={l} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.axis} />;
      })}
      <text x={labelAt.x + dx} y={labelAt.y} className={styles.axisLabel} textAnchor="middle" dominantBaseline="central">
        {label}
      </text>
    </g>
  );
}
