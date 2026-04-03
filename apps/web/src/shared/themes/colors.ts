export const COLORS = {
  Background: '#171F2C',
  Background2: '#1E232B',
  Content: '#F4F4F5',
  Content50: '#F4F4F580',
  Primary: '#F6C01B',
  Secondary: '#6498CA',
  Accent: '#2FBAD8',
  Primary100: '#FEF8D1',
  Primary200: '#FEEEA3',
  Primary300: '#FCE175',
  Primary400: '#F9D452',
  Primary500: '#F6C01B',
  Primary600: '#D39F13',
  Primary700: '#B1800D',
  Primary800: '#8E6308',
  Primary900: '#764E05',
  Success100: '#E2FDDD',
  Success200: '#C0FCBB',
  Success300: '#98F89A',
  Success400: '#7DF18A',
  Success500: '#53E873',
  Success600: '#3CC767',
  Success700: '#29A75C',
  Success800: '#1A8650',
  Success900: '#0F6F48',
  Info100: '#D5FDF8',
  Info200: '#ACFBF7',
  Info300: '#81F0F3',
  Info400: '#5FD9E7',
  Info500: '#2FBAD8',
  Info600: '#2293B9',
  Info700: '#17709B',
  Info800: '#0E507D',
  Info900: '#093A67',
  Warning100: '#FFF6D7',
  Warning200: '#FFEBB0',
  Warning300: '#FFDE88',
  Warning400: '#FFD06B',
  Warning500: '#FFBA3A',
  Warning600: '#DB962A',
  Warning700: '#B7761D',
  Warning800: '#935812',
  Warning900: '#7A430B',
  Danger100: '#FFE5DF',
  Danger200: '#FFC7C0',
  Danger300: '#FFA2A1',
  Danger400: '#FF8A93',
  Danger500: '#FF637F',
  Danger600: '#DB4870',
  Danger700: '#B73163',
  Danger800: '#931F55',
  Danger900: '#7A134C',
  SpbSky1: '#ADADB1',
  SpbSky1opacity30: '#ADADB1',
  SpbSky2: '#777F85',
  SpbSky3: '#333A43',
  SpbSky4: '#1E232A',
  Fury: '#D91010',
  Love: '#BE0D0D',
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
