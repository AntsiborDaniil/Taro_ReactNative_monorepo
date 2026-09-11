import { Platform, StyleSheet } from 'react-native';
import { SpreadsCategory } from 'shared/api';
import { COLORS, getColorOpacity } from 'shared/themes';
import { WEB_HOVER_TRANSITION } from './web/hoverTransition';

export const SPREAD_CATEGORY_ACCENT: Record<SpreadsCategory, string> = {
  [SpreadsCategory.Simple]: COLORS.Primary,
  [SpreadsCategory.Thematic]: COLORS.Secondary,
  [SpreadsCategory.Universal]: COLORS.Accent,
  [SpreadsCategory.SelfDevelopment]: COLORS.Info500,
  [SpreadsCategory.Choice]: COLORS.Warning500,
};

export const spreadInnerStyles = StyleSheet.create({
  glassPanel: {
    backgroundColor: 'rgba(22, 28, 38, 0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 18),
    padding: 16,
    overflow: 'visible',
    ...Platform.select({
      web: {
        boxShadow:
          '0 14px 36px rgba(8, 12, 20, 0.4), inset 0 1px 0 rgba(246, 192, 27, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  sectionLabel: {
    color: COLORS.Primary400,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 12,
  },
  categoryChip: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroShell: {
    width: '100%',
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.SpbSky4,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 28),
    ...Platform.select({
      web: {
        boxShadow:
          '0 18px 40px rgba(8, 12, 20, 0.45), 0 0 32px rgba(246, 192, 27, 0.1)',
      },
      default: {
        shadowColor: COLORS.Primary500,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 12,
      },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        objectFit: 'cover' as const,
        objectPosition: 'center center' as const,
      },
    }),
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    pointerEvents: 'none',
  },
  descriptionText: {
    color: getColorOpacity(COLORS.Content, 76),
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 520,
    alignSelf: 'center',
    letterSpacing: 0.15,
  },
  altarZone: {
    width: '100%',
    maxWidth: 480,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 26),
    backgroundColor: 'rgba(14, 18, 28, 0.92)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    marginHorizontal: 16,
    ...Platform.select({
      web: {
        isolation: 'isolate',
        boxShadow: 'inset 0 0 40px rgba(246, 192, 27, 0.04)',
      } as object,
      default: {},
    }),
  },
  altarGlowClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 28,
    pointerEvents: 'none',
  },
  altarGlow: {
    position: 'absolute',
    width: '70%',
    height: '42%',
    bottom: '4%',
    left: '15%',
    borderRadius: 999,
    backgroundColor: getColorOpacity(COLORS.Primary500, 7),
    pointerEvents: 'none',
  },
  altarHint: {
    marginTop: 10,
    textAlign: 'center',
    color: getColorOpacity(COLORS.Primary200, 72),
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  completionPanel: {
    alignItems: 'center',
    padding: 28,
    gap: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 42),
    backgroundColor: 'rgba(22, 28, 38, 0.94)',
    marginHorizontal: 16,
    ...Platform.select({
      web: {
        boxShadow:
          '0 18px 44px rgba(8, 12, 20, 0.45), 0 0 36px rgba(246, 192, 27, 0.14)',
      },
      default: {},
    }),
  },
  completionTitle: {
    textAlign: 'center',
    color: COLORS.Primary500,
    letterSpacing: 0.4,
  },
  stickyCta: {
    marginTop: 8,
    borderRadius: 32,
    height: 52,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 48),
    backgroundColor: getColorOpacity(COLORS.Primary500, 18),
    ...Platform.select({
      web: {
        boxShadow:
          '0 10px 28px rgba(85, 62, 21, 0.3), 0 0 22px rgba(246, 192, 27, 0.16)',
        ...WEB_HOVER_TRANSITION,
      },
      default: {},
    }),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
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
    backgroundColor: getColorOpacity(COLORS.Primary500, 22),
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
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 14),
    backgroundColor: 'rgba(22, 28, 38, 0.82)',
    marginBottom: 12,
    ...Platform.select({
      web: {
        ...WEB_HOVER_TRANSITION,
        cursor: 'default' as const,
      },
      default: {},
    }),
  },
  positionCardActive: {
    borderColor: getColorOpacity(COLORS.Primary500, 55),
    backgroundColor: getColorOpacity(COLORS.Primary500, 10),
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(246, 192, 27, 0.12)',
      },
      default: {},
    }),
  },
  positionCardDone: {
    borderColor: getColorOpacity(COLORS.Success500, 38),
  },
  positionCardPressable: Platform.select({
    web: { cursor: 'pointer' as const },
    default: {},
  }),
  positionIndex: {
    color: COLORS.Primary400,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  positionMeaning: {
    color: COLORS.Content,
    lineHeight: 20,
  },
  readingPositionLabel: {
    textAlign: 'center',
    color: COLORS.Primary400,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  readingPositionTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  readingCardFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: getColorOpacity(COLORS.Primary500, 48),
    borderRadius: 18,
    padding: 5,
    backgroundColor: 'rgba(8, 12, 20, 0.35)',
    ...Platform.select({
      web: {
        boxShadow:
          '0 20px 40px rgba(0, 0, 0, 0.45), 0 0 28px rgba(246, 192, 27, 0.14)',
      },
      default: {
        shadowColor: COLORS.Primary500,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 14,
      },
    }),
  },
  summaryScroll: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 42),
    backgroundColor: 'rgba(22, 28, 38, 0.96)',
    padding: 22,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 40px rgba(8, 12, 20, 0.4)',
      },
      default: {},
    }),
  },
  summaryScrollAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.Primary500,
  },
  summaryText: {
    color: getColorOpacity(COLORS.Content, 88),
    lineHeight: 24,
    textAlign: 'left',
  },
  reversedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Warning500, 40),
    backgroundColor: getColorOpacity(COLORS.Warning500, 12),
  },
  reversedChipText: {
    color: COLORS.Warning400,
    fontSize: 13,
    lineHeight: 16,
  },
});
