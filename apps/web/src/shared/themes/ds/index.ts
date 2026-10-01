/**
 * Токены дизайн-системы Таро (строго по n8n-tarot/design-system.html).
 *
 * Общий слой для экранов, переведённых на DS (главная, расклады).
 * Старые темы (shared/themes/*) не затрагиваются. Импортировать явно: `shared/themes/ds`.
 *
 * Контраст (WCAG): ink50/ground900 15.48 · ink50/ground800 13.71 · ink100/ground700 9.41 ·
 * ink100/ground600 6.91 · accent400/ground800 7.7 · onAction/action500 5.26 ·
 * calm500/ground900 4.83 (только графика).
 * DS не задаёт теней — глубина только ступенями грунта.
 */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/* ------------------------------------------------------------------ цвета §02 */

export const DS_COLORS = {
  /** Фон. */
  ground900: '#091519',
  /** Скрим. */
  ground800: '#0f2228',
  /** Поверхность. */
  ground700: '#17333d',
  /** Плашка, строка, рамка. */
  ground600: '#204956',
  calm600: '#206a75',
  /** Фокус. */
  calm500: '#2c8e9e',
  /** Грань, метка, полоса выбора. */
  accent400: '#eaa433',
  /** Единственное действие. */
  action500: '#ef5334',
  alarm600: '#b04027',
  ink100: '#dadbbc',
  ink50: '#ecedcb',
  /** Текст на action500 — тёмная краска. */
  onAction: '#091519',
  /** Затемнение при нажатии (18 %). */
  pressDim: 'rgba(9, 21, 25, 0.18)',
  skeletonBase: '#17333d',
  skeletonHighlight: '#204956',
} as const;

export type DsColorToken = keyof typeof DS_COLORS;

/* ---------------------------------------------------------------- отступы §08 */

/** Только эти ступени. */
export const DS_SPACE = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type DsSpaceToken = keyof typeof DS_SPACE;

/* ------------------------------------------------------------- брейкпоинты */

/** Совпадают с RESPONSIVE_BREAKPOINTS. Считать по ширине контейнера, не окна. */
export const DS_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type DsViewport = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function getDsViewport(containerWidth: number): DsViewport {
  if (containerWidth >= DS_BREAKPOINTS.wide) return 'wide';
  if (containerWidth >= DS_BREAKPOINTS.desktop) return 'desktop';
  if (containerWidth >= DS_BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/* ------------------------------------------------------------------ сетка */

export const DS_LAYOUT = {
  /** Поле экрана. */
  gutter: 25,
  /** Макс. ширина контента. */
  maxWidth: { mobile: undefined, tablet: 720, desktop: 1200, wide: 1320 } as Record<
    DsViewport,
    number | undefined
  >,
  sectionGap: { mobile: 32, tablet: 32, desktop: 48, wide: 48 } as Record<DsViewport, number>,
  columnGap: 32,
} as const;

/* --------------------------------------------------------- типографика §06 */

/** Имена совпадают с регистрацией в shared/lib/web/appFonts.ts: один файл = один вес. */
export const DS_FONT_FAMILY = {
  geologica800: 'Geologica-ExtraBold',
  geologica900: 'Geologica-Black',
  onest500: 'Onest-Medium',
  onest600: 'Onest-SemiBold',
  onest700: 'Onest-Bold',
  onest800: 'Onest-ExtraBold',
} as const;

const webFallback = (family: string) =>
  Platform.OS === 'web' ? `'${family}', system-ui, sans-serif` : family;

export type DsTypeToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: TextStyle['textTransform'];
};

export type DsTypeRole = 'display' | 'title' | 'lead' | 'body' | 'label' | 'micro' | 'button' | 'chip';

const type = (
  family: string,
  fontSize: number,
  lineHeightRatio: number,
  letterSpacingEm: number,
  textTransform?: TextStyle['textTransform'],
): DsTypeToken => ({
  fontFamily: webFallback(family),
  fontSize,
  lineHeight: Math.round(fontSize * lineHeightRatio),
  letterSpacing: Math.round(fontSize * letterSpacingEm * 100) / 100,
  ...(textTransform ? { textTransform } : null),
});

/** Одна шкала на все ширины. */
export const DS_TYPE: Record<DsTypeRole, DsTypeToken> = {
  display: type(DS_FONT_FAMILY.geologica900, 34, 1.05, -0.02),
  title: type(DS_FONT_FAMILY.geologica800, 25, 1.15, -0.015),
  lead: type(DS_FONT_FAMILY.onest700, 19, 1.3, 0),
  body: type(DS_FONT_FAMILY.onest500, 16, 1.5, 0),
  label: type(DS_FONT_FAMILY.onest700, 13, 1.35, 0.1, 'uppercase'),
  micro: type(DS_FONT_FAMILY.onest600, 12, 1.4, 0.06),
  /** Кнопка §11: Onest 800 19. */
  button: type(DS_FONT_FAMILY.onest800, 19, 1.2, 0),
  /** Чип-метка §11: Onest 700 15, трекинг 2.2, капс. */
  chip: { ...type(DS_FONT_FAMILY.onest700, 15, 1.2, 0, 'uppercase'), letterSpacing: 2.2 },
};

/** Пол читаемости. */
export const DS_TEXT_FLOOR = 11;

/** Стиль текста для `Text` из react-native. Без fontWeight — вес задаёт файл шрифта. */
export function dsText(role: DsTypeRole, color: string): TextStyle {
  return { ...DS_TYPE[role], color };
}

/* ----------------------------------------------------------------- радиусы §07 */

export const dsRadius = {
  /** Кнопка, чип — h / 2. */
  capsule: (height: number) => Math.round(height / 2),
  /** Оправа карты — 9 % ширины. */
  card: (width: number) => Math.round(width * 0.09),
  /** Плашка — 38 % высоты, 16–40. */
  plate: (height: number) => Math.round(Math.min(40, Math.max(16, height * 0.38))),
  /** Поле — 26 % высоты. */
  field: (height: number) => Math.round(height * 0.26),
  /** Лист — 5 % ширины экрана. */
  sheet: (screenWidth: number) => Math.round(screenWidth * 0.05),
  /** Окно / тайл — 4 % ширины. */
  window: (width: number) => Math.round(width * 0.04),
  /** Строка списка. */
  listRow: 18,
} as const;

/* ------------------------------------------------------------ размеры §11 */

export const DS_SIZES = {
  buttonHeight: 52,
  chipHeight: 40,
  listRowHeight: 64,
  listRowThumb: 40,
  selectionBar: 5,
  fieldHeight: 74,
  fieldRadius: 24,
  fieldBorder: 1.6,
  fieldBorderFocus: 2.4,
  minTouch: 44,
  edgeWidth: 2,
  focusRingWidth: 2,
  hairline: 1,
} as const;

/* ----------------------------------------------------------------- движение §10 */

export const DS_MOTION = {
  feedback: 100,
  state: 220,
  block: 400,
  scene: 700,
  stagger: 60,
  maxStaggered: 4,
  easeOut: [0.16, 1, 0.3, 1] as const,
  entryShift: 12,
  pressShiftY: 1,
} as const;

/* ------------------------------------------------------------ геометрия §04 */

/** Восходящий срез (совет/решение): слева ниже, справа выше. Доли высоты поверхности. */
export const DS_CUT_ASCENDING = {
  leftY: 0.62,
  rightY: 0.5,
} as const;

/* ------------------------------------------------------- web-только стили */

const isWeb = Platform.OS === 'web';

/** Бирюзовое кольцо фокуса (показывать только при фокусе с клавиатуры). */
export const dsFocusRing: ViewStyle = isWeb
  ? ({
      outlineColor: DS_COLORS.calm500,
      outlineStyle: 'solid',
      outlineWidth: DS_SIZES.focusRingWidth,
      outlineOffset: 2,
    } as object)
  : {};

export const dsWebTransition: ViewStyle = isWeb
  ? ({
      transitionProperty: 'background-color, border-color, transform, opacity',
      transitionDuration: `${DS_MOTION.state}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
    } as object)
  : {};

/** Для reduced motion — мгновенная смена состояния. */
export const dsWebTransitionReduced: ViewStyle = isWeb
  ? ({ transitionDuration: '0ms', cursor: 'pointer' } as object)
  : {};
