import {
  Body,
  EclipticGeoMoon,
  GeoVector,
  Illumination,
  MakeTime,
  MoonPhase,
  Rotation_EQJ_ECT,
  RotateVector,
  SearchMoonPhase,
  SiderealTime,
  SphereFromVector,
  SunPosition,
  e_tilt,
  type AstroTime,
} from 'astronomy-engine';
import { signOfLongitude, type ZodiacSign } from './zodiac';

/**
 * Астро-движок на astronomy-engine (MIT, точность ~1′) — считает на устройстве,
 * дата рождения не уходит на сервер. Тропический зодиак, геоцентрические долготы
 * в истинной эклиптике даты. Дома — Whole Sign от асцендента.
 */

export const PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;
export type Planet = (typeof PLANETS)[number];

const BODY: Record<Exclude<Planet, 'sun' | 'moon'>, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

const norm = (deg: number) => ((deg % 360) + 360) % 360;
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Геоцентрическая долгота тела в истинной эклиптике даты. */
export function longitudeOf(planet: Planet, time: AstroTime): number {
  if (planet === 'sun') return norm(SunPosition(time).elon);
  if (planet === 'moon') return norm(EclipticGeoMoon(time).lon);
  const vec = GeoVector(BODY[planet], time, true);
  return norm(SphereFromVector(RotateVector(Rotation_EQJ_ECT(time), vec)).lon);
}

/** Ретроградность: долгота убывает за сутки (Солнце и Луна не бывают ретро). */
export function isRetrograde(planet: Planet, date: Date): boolean {
  if (planet === 'sun' || planet === 'moon') return false;
  const before = longitudeOf(planet, MakeTime(new Date(date.getTime() - 12 * 3600_000)));
  const after = longitudeOf(planet, MakeTime(new Date(date.getTime() + 12 * 3600_000)));
  const delta = ((after - before + 540) % 360) - 180;
  return delta < 0;
}

/** Асцендент и MC по звёздному времени и широте (стандартные формулы). */
export function angles(date: Date, lat: number, lon: number): { asc: number; mc: number } {
  const time = MakeTime(date);
  const ramc = rad(norm(SiderealTime(time) * 15 + lon));
  const eps = rad(e_tilt(time).tobl);
  const phi = rad(lat);
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))));
  return { asc, mc };
}

/** Смещение пояса (мс) в момент utcMs — по ICU (исторические правила IANA). */
function tzOffsetMs(tz: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - utcMs;
}

/** Местное «настенное» время в поясе tz → момент UTC. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - tzOffsetMs(tz, wall);
  utc = wall - tzOffsetMs(tz, utc);
  return new Date(utc);
}

export type PlanetPosition = {
  planet: Planet;
  lon: number;
  sign: ZodiacSign;
  degree: number;
  retro: boolean;
  /** Дом Whole Sign (1–12), если известно время и место. */
  house: number | null;
};

export type NatalChart = {
  planets: PlanetPosition[];
  asc: { lon: number; sign: ZodiacSign; degree: number } | null;
  mc: { lon: number; sign: ZodiacSign; degree: number } | null;
  /** Время неизвестно: считаем на полдень, Луна приблизительна, без асцендента и домов. */
  timeKnown: boolean;
};

export type BirthInput = { date: string; time: string | null; lat: number | null; lon: number | null; tz: string | null };

export function natalChart(input: BirthInput): NatalChart {
  const timeKnown = Boolean(input.time && input.tz && input.lat != null && input.lon != null);
  const tz = input.tz ?? 'Europe/Moscow';
  const moment = zonedToUtc(input.date, timeKnown ? (input.time as string) : '12:00', tz);
  const time = MakeTime(moment);
  const ang = timeKnown ? angles(moment, input.lat as number, input.lon as number) : null;
  const ascSign = ang ? Math.floor(ang.asc / 30) : null;
  const planets = PLANETS.map((planet) => {
    const lon = longitudeOf(planet, time);
    const { sign, degree } = signOfLongitude(lon);
    const house = ascSign == null ? null : ((Math.floor(lon / 30) - ascSign + 12) % 12) + 1;
    return { planet, lon, sign, degree, retro: isRetrograde(planet, moment), house };
  });
  return {
    planets,
    asc: ang ? { lon: ang.asc, ...signOfLongitude(ang.asc) } : null,
    mc: ang ? { lon: ang.mc, ...signOfLongitude(ang.mc) } : null,
    timeKnown,
  };
}

export type MoonPhaseName =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export function phaseName(angle: number): MoonPhaseName {
  const names: MoonPhaseName[] = [
    'new',
    'waxingCrescent',
    'firstQuarter',
    'waxingGibbous',
    'full',
    'waningGibbous',
    'lastQuarter',
    'waningCrescent',
  ];
  return names[Math.floor(norm(angle + 22.5) / 45) % 8];
}

export type SkyToday = {
  moonSign: ZodiacSign;
  moonDegree: number;
  phase: MoonPhaseName;
  /** 0–100, освещённая доля диска. */
  illumination: number;
  waxing: boolean;
  nextNew: Date | null;
  nextFull: Date | null;
  sunSign: ZodiacSign;
  retrograde: Planet[];
};

export function skyToday(date: Date = new Date()): SkyToday {
  const time = MakeTime(date);
  const angle = MoonPhase(time);
  const moon = signOfLongitude(longitudeOf('moon', time));
  return {
    moonSign: moon.sign,
    moonDegree: moon.degree,
    phase: phaseName(angle),
    illumination: Math.round(Illumination(Body.Moon, time).phase_fraction * 100),
    waxing: angle < 180,
    nextNew: SearchMoonPhase(0, time, 32)?.date ?? null,
    nextFull: SearchMoonPhase(180, time, 32)?.date ?? null,
    sunSign: signOfLongitude(longitudeOf('sun', time)).sign,
    retrograde: (['mercury', 'venus', 'mars', 'jupiter', 'saturn'] as Planet[]).filter((p) => isRetrograde(p, date)),
  };
}
