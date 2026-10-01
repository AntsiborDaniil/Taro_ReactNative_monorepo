/**
 * Значения переназначены на DS-эквиваленты (shared/themes/ds) — старые имена сохранены,
 * их используют десятки файлов вне DS-экранов. Не добавлять новых имён без нужды.
 */
import { DS_COLORS } from './ds';

/**
 * Явная аннотация `string`: значения берутся из DS_COLORS (`as const`), без неё каждое
 * поле получало бы точный литеральный тип (напр. `"#204956"`) и ломало код, ожидающий `string`.
 */
export const COLORS: Record<string, string> = {
  Background: DS_COLORS.ground900,
  Background2: DS_COLORS.ground800,
  Content: DS_COLORS.ink50,
  Content50: `${DS_COLORS.ink100}CC`,
  Primary: DS_COLORS.accent400,
  Secondary: DS_COLORS.calm500,
  Accent: DS_COLORS.calm600,
  Primary100: DS_COLORS.accent400,
  Primary200: DS_COLORS.accent400,
  Primary300: DS_COLORS.accent400,
  Primary400: DS_COLORS.accent400,
  Primary500: DS_COLORS.accent400,
  Primary600: DS_COLORS.accent400,
  Primary700: DS_COLORS.accent400,
  Primary800: DS_COLORS.accent400,
  Primary900: DS_COLORS.accent400,
  Success100: DS_COLORS.calm500,
  Success200: DS_COLORS.calm500,
  Success300: DS_COLORS.calm500,
  Success400: DS_COLORS.calm500,
  Success500: DS_COLORS.calm500,
  Success600: DS_COLORS.calm600,
  Success700: DS_COLORS.calm600,
  Success800: DS_COLORS.calm600,
  Success900: DS_COLORS.calm600,
  Info100: DS_COLORS.calm500,
  Info200: DS_COLORS.calm500,
  Info300: DS_COLORS.calm500,
  Info400: DS_COLORS.calm500,
  Info500: DS_COLORS.calm500,
  Info600: DS_COLORS.calm600,
  Info700: DS_COLORS.calm600,
  Info800: DS_COLORS.calm600,
  Info900: DS_COLORS.calm600,
  Warning100: DS_COLORS.accent400,
  Warning200: DS_COLORS.accent400,
  Warning300: DS_COLORS.accent400,
  Warning400: DS_COLORS.accent400,
  Warning500: DS_COLORS.accent400,
  Warning600: DS_COLORS.accent400,
  Warning700: DS_COLORS.accent400,
  Warning800: DS_COLORS.accent400,
  Warning900: DS_COLORS.accent400,
  Danger100: DS_COLORS.alarm600,
  Danger200: DS_COLORS.alarm600,
  Danger300: DS_COLORS.alarm600,
  Danger400: DS_COLORS.alarm600,
  Danger500: DS_COLORS.alarm600,
  Danger600: DS_COLORS.alarm600,
  Danger700: DS_COLORS.alarm600,
  Danger800: DS_COLORS.alarm600,
  Danger900: DS_COLORS.alarm600,
  SpbSky1: DS_COLORS.ink100,
  SpbSky1opacity30: DS_COLORS.ink100,
  SpbSky2: DS_COLORS.ground600,
  SpbSky3: DS_COLORS.ground600,
  SpbSky4: DS_COLORS.ground800,
  Fury: DS_COLORS.alarm600,
  Love: DS_COLORS.alarm600,
};

export const KITTEN_COLORS: Record<string, string> = {
  'background-basic-color-1': 'Background',
  'color-background-800': 'Background2',
  'color-basic-100': 'Content',
  'color-basic-500': 'Content50',
  'color-primary-500': 'Primary',
  'color-secondary-500': 'Secondary',
  'color-info-500': 'Info500',
  'color-info-active': 'Info200',
  'color-basic-600': 'SpbSky1',
  'color-gray-500': 'SpbSky2',
  'color-gray-700': 'SpbSky3',
  'color-basic-1000': 'SpbSky4',
};

export function getKittenColors(): Record<string, string> {
  return Object.entries(KITTEN_COLORS).reduce(
    (acc: Record<string, string>, [kittenColorName, ourColorName]) => {
      const hex = COLORS[ourColorName as keyof typeof COLORS];

      if (!hex) {
        return acc;
      }

      return { ...acc, [kittenColorName]: hex };
    },
    {}
  );
}
