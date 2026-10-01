import { StyleSheet } from 'react-native';
import { SpreadsCategory } from 'shared/api';
import { DS_COLORS, DS_SPACE, dsRadius, dsText } from 'shared/themes/ds';

/** Метка категории расклада — грань DS: accent для тематики/выбора, calm для развития/универсальных. */
export const SPREAD_CATEGORY_ACCENT: Record<SpreadsCategory, string> = {
  [SpreadsCategory.Simple]: DS_COLORS.accent400,
  [SpreadsCategory.Thematic]: DS_COLORS.calm500,
  [SpreadsCategory.Universal]: DS_COLORS.calm600,
  [SpreadsCategory.SelfDevelopment]: DS_COLORS.calm500,
  [SpreadsCategory.Choice]: DS_COLORS.accent400,
};

/** Общие DS-стили для процесса гадания (регистр «Журнал»): без теней/glow/градиентов. */
export const spreadInnerStyles = StyleSheet.create({
  glassPanel: {
    backgroundColor: DS_COLORS.ground800,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    padding: DS_SPACE.l,
  },
  sectionLabel: {
    ...dsText('label', DS_COLORS.accent400),
    marginBottom: DS_SPACE.m,
  },
  /** Надпись-категория над заголовком: одна строка, без капсулы (длинные категории не переносятся). */
  categoryEyebrow: {
    ...dsText('label', DS_COLORS.accent400),
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  /** Колонка контента: не шире DS_LAYOUT (иначе картинка растягивается за экран на wide). */
  heroShell: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: DS_COLORS.ground800,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  /** Текстовый блок под картинкой (без градиента-затемнения поверх изображения). */
  heroFade: {
    paddingHorizontal: DS_SPACE.l,
    paddingVertical: DS_SPACE.l,
    gap: DS_SPACE.s,
    alignItems: 'center',
  },
  descriptionText: {
    ...dsText('body', DS_COLORS.ink100),
    textAlign: 'center',
    maxWidth: 520,
    alignSelf: 'center',
  },
  altarZone: {
    width: '100%',
    maxWidth: 480,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: DS_SPACE.l,
    paddingHorizontal: DS_SPACE.m,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    position: 'relative',
    marginHorizontal: DS_SPACE.l,
  },
  altarHint: {
    marginTop: DS_SPACE.s,
    textAlign: 'center',
    ...dsText('micro', DS_COLORS.ink100),
  },
  completionPanel: {
    alignItems: 'center',
    padding: DS_SPACE.xl,
    gap: DS_SPACE.l,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    marginHorizontal: DS_SPACE.l,
  },
  completionTitle: {
    textAlign: 'center',
    color: DS_COLORS.ink50,
  },
  /** Только отступ — фон/кант/радиус берёт shared/ui Button (капсула action500). */
  stickyCta: {
    marginTop: DS_SPACE.s,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: DS_SPACE.m,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    bottom: -16,
    width: 2,
    backgroundColor: DS_COLORS.ground600,
    borderRadius: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    borderWidth: 2,
    zIndex: 1,
  },
  positionCard: {
    flex: 1,
    flexDirection: 'row',
    gap: DS_SPACE.m,
    padding: DS_SPACE.m,
    borderRadius: dsRadius.listRow,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    marginBottom: DS_SPACE.m,
  },
  positionCardActive: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground600,
  },
  positionCardDone: {
    borderColor: DS_COLORS.calm500,
  },
  positionCardPressable: {},
  positionIndex: {
    ...dsText('micro', DS_COLORS.ink100),
  },
  positionMeaning: {
    ...dsText('body', DS_COLORS.ink50),
  },
  readingPositionLabel: {
    textAlign: 'center',
    marginBottom: DS_SPACE.xs,
    ...dsText('micro', DS_COLORS.ink100),
  },
  readingPositionTitle: {
    textAlign: 'center',
    marginBottom: DS_SPACE.xs,
  },
  readingCardFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    borderRadius: 20,
    padding: DS_SPACE.xs,
    backgroundColor: DS_COLORS.ground800,
  },
  /** Читабельная колонка ответа AI: body 16/1.5, max ~720. */
  summaryScroll: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    padding: DS_SPACE.xl,
    gap: DS_SPACE.m,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  summaryScrollAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: DS_COLORS.accent400,
  },
  summaryText: {
    ...dsText('body', DS_COLORS.ink50),
    textAlign: 'left',
  },
  reversedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS_SPACE.xs,
    alignSelf: 'center',
    paddingHorizontal: DS_SPACE.m,
    paddingVertical: DS_SPACE.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground700,
  },
  reversedChipText: {
    ...dsText('micro', DS_COLORS.accent400),
  },
});
