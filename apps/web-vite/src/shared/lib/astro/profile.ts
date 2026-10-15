import { useSyncExternalStore } from 'react';
import { isZodiacSign, sunSignByDate, type ZodiacSign } from './zodiac';

/**
 * Астро-профиль — ТОЛЬКО на этом устройстве (localStorage). На сервер, в user_settings
 * и в OpenAI данные рождения не уходят: натальная карта считается на устройстве
 * (engine.ts), на сервер — только знак (гороскоп по знаку, без личных данных).
 * Уровни точности: только знак → дата → дата+время+город (полная карта).
 */
export type AstroProfile = {
  /** Знак Солнца: выбран вручную или посчитан по дате. */
  sign: ZodiacSign;
  /** Дата рождения YYYY-MM-DD (необязательно). */
  birthDate: string | null;
  /** Время HH:MM, если известно точно. */
  birthTime: string | null;
  /** Город из cities.ts (координаты и пояс), если указан. */
  cityId: string | null;
};

const KEY = 'mt.astroProfile.v1';
const listeners = new Set<() => void>();
let cache: AstroProfile | null | undefined;

function read(): AstroProfile | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Partial<AstroProfile> | null;
    if (!parsed || !isZodiacSign(parsed.sign)) return null;
    const date = typeof parsed.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.birthDate) ? parsed.birthDate : null;
    return {
      sign: parsed.sign,
      birthDate: date,
      birthTime: date && typeof parsed.birthTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.birthTime) ? parsed.birthTime : null,
      cityId: date && typeof parsed.cityId === 'string' ? parsed.cityId : null,
    };
  } catch {
    return null;
  }
}

export function getAstroProfile(): AstroProfile | null {
  if (cache === undefined) cache = read();
  return cache;
}

function emit(next: AstroProfile | null): void {
  cache = next;
  listeners.forEach((listener) => listener());
}

export function saveAstroProfile(profile: AstroProfile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* приватный режим — профиль живёт до перезагрузки */
  }
  emit(profile);
}

/** «Удалить мои астро-данные»: стирает всё с устройства. */
export function clearAstroProfile(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit(null);
}

/** Профиль из даты: знак считается по дате. */
export function profileFromBirth(birthDate: string, birthTime: string | null, cityId: string | null): AstroProfile {
  const [, m, d] = birthDate.split('-').map(Number);
  return { sign: sunSignByDate(m, d), birthDate, birthTime, cityId };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) emit(read());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useAstroProfile(): AstroProfile | null {
  return useSyncExternalStore(subscribe, getAstroProfile, () => null);
}
