import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Line, Polygon, Svg } from 'react-native-svg';
import AppMetrica from '@appmetrica/react-native-analytics';
import {
  ApplicationConfigContext,
  type TApplicationConfigHookResult,
} from 'entities/ApplicationConfig';
import { SpreadContext, type TSpreadHookResult } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { simpleSpreads } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getImage } from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute, type PressableWebState } from 'shared/types';
import {
  DS_COLORS,
  DS_CUT_ASCENDING,
  DS_MOTION,
  DS_SIZES,
  DS_SPACE,
  type DsViewport,
  dsFocusRing,
  dsRadius,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
} from 'shared/themes/ds';
import { Chevron } from '../../icons';
import { useKeyboardFocusVisible } from 'pages/main/lib/useKeyboardFocusVisible';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const BUTTON_RADIUS = dsRadius.capsule(DS_SIZES.buttonHeight);
/** Затемнение при наведении (18% ink-50 поверх кнопки) — вариант альфы токена ink-50, не новый цвет. */
const HOVER_TINT = 'rgba(236, 237, 203, 0.12)';

/** Заглавная только первая буква строки (DS: не капитализировать каждое слово датой). */
function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Вход блока вдоль среза: opacity 0→1 + сдвиг (−entryShift, +entryShift) → 0. */
function useEntryStyle(progress: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: (1 - progress.value) * -DS_MOTION.entryShift },
      { translateY: (1 - progress.value) * DS_MOTION.entryShift },
    ],
  }));
}

type CutGeometry = {
  width: number;
  height: number;
  leftY: number;
  rightY: number;
};

/** Грань среза: полигон-заливка статична, анимируется только Line (strokeDashoffset). */
function HeroCutEdge({
  geometry,
  progress,
}: {
  geometry: CutGeometry;
  progress: SharedValue<number>;
}) {
  const { width, height, leftY, rightY } = geometry;
  const lineLength = Math.max(1, Math.hypot(width, leftY - rightY));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - progress.value) * lineLength,
  }));

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Polygon
        points={`0,${leftY} ${width},${rightY} ${width},${height} 0,${height}`}
        fill={DS_COLORS.ground800}
      />
      <AnimatedLine
        x1={0}
        y1={leftY}
        x2={width}
        y2={rightY}
        stroke={DS_COLORS.accent400}
        strokeWidth={DS_SIZES.edgeWidth}
        strokeDasharray={`${lineLength}`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

type DayAdviceProps = {
  /**
   * Viewport страницы (ширина КОНТЕЙНЕРА, не карточки героя) — передаётся из
   * Main/useMainLayout. Если мерить от ширины самой карточки (она уже сжата
   * flex:7 колонкой), вариант «мир справа 40%» на десктопе никогда не включится.
   */
  viewport: DsViewport;
};

function DayAdvice({ viewport }: DayAdviceProps) {
  const { t } = useTranslation();
  const { navigate } = useNativeNavigation();
  const reducedMotion = useReducedMotion();
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();

  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAnimatedRef = useRef(false);

  const isDesktop = viewport === 'desktop' || viewport === 'wide';
  const dateLabel = capitalizeFirst(getCurrentDate('badge'));
  const windowRadius = surfaceSize.width
    ? dsRadius.window(surfaceSize.width)
    : 12;
  const contentPadding = viewport === 'mobile' ? DS_SPACE.l : DS_SPACE.xl;

  const { selectSpread } = useData<Partial<TSpreadHookResult>>({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData<Partial<TApplicationConfigHookResult>>({
    Context: ApplicationConfigContext,
  });

  const handleSurfaceLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setSurfaceSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    }
  }, []);

  const handleSelectDayAdvice = async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      AppMetrica.reportEvent(AnalyticAction.ClickDayCard);
      await handleVibrationClick?.();
      await selectSpread?.(simpleSpreads.daySuggest);
      navigate(TabRoute.MainTab, {
        screen: NavigationRoute.DayAdvice,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Геометрия мобильного/планшетного среза (мир сверху ~40%, скрим ниже):
  // левая точка = собственная высота иллюстрации (доля ширины, не зависит от
  // текста — без этого измеренный верх текста и высота иллюстрации образуют
  // цикл обратной связи и схлопывают мир до нуля), правая — чуть выше (мира
  // больше справа). Контент получает paddingTop = leftY + 16, поэтому текст
  // геометрически не может оказаться выше среза — измерять его верх не нужно.
  const stackedGeometry: CutGeometry = (() => {
    const width = surfaceSize.width || 1;
    const leftY = Math.round(width / 1.7);
    const rightY = Math.round(leftY * (DS_CUT_ASCENDING.rightY / DS_CUT_ASCENDING.leftY));
    return { width, height: surfaceSize.height || leftY, leftY, rightY };
  })();

  // Геометрия desktop/wide (мир справа 40% ширины): срез вертикально-наклонный,
  // накрывает левый край картиночной колонки клином ground-800 — восходящий
  // (мира больше внизу колонки, чем вверху).
  const imageColWidth = Math.round(surfaceSize.width * 0.4);
  const tilt = 28;

  const edgeProgress = useSharedValue(reducedMotion ? 1 : 0);
  const titleProgress = useSharedValue(reducedMotion ? 1 : 0);
  const textProgress = useSharedValue(reducedMotion ? 1 : 0);
  const ctaProgress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    const hasLayout = surfaceSize.width > 0 && surfaceSize.height > 0;
    if (!hasLayout || hasAnimatedRef.current) {
      return;
    }
    hasAnimatedRef.current = true;

    if (reducedMotion) {
      return;
    }

    const easing = Easing.bezier(
      DS_MOTION.easeOut[0],
      DS_MOTION.easeOut[1],
      DS_MOTION.easeOut[2],
      DS_MOTION.easeOut[3]
    );
    edgeProgress.value = withTiming(1, { duration: DS_MOTION.block, easing });
    titleProgress.value = withDelay(
      DS_MOTION.block,
      withTiming(1, { duration: DS_MOTION.block, easing })
    );
    textProgress.value = withDelay(
      DS_MOTION.block + DS_MOTION.stagger,
      withTiming(1, { duration: DS_MOTION.block, easing })
    );
    ctaProgress.value = withDelay(
      DS_MOTION.block + DS_MOTION.stagger * 2,
      withTiming(1, { duration: DS_MOTION.block, easing })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceSize.width, surfaceSize.height, reducedMotion]);

  const titleAnimatedStyle = useEntryStyle(titleProgress);
  const textAnimatedStyle = useEntryStyle(textProgress);
  const ctaAnimatedStyle = useEntryStyle(ctaProgress);

  const [ctaHovered, setCtaHovered] = useState(false);
  const [ctaPressed, setCtaPressed] = useState(false);

  const button = (
    <Animated.View
      style={[
        styles.ctaBase,
        viewport === 'mobile' ? styles.ctaFull : styles.ctaInline,
        ctaAnimatedStyle,
        ctaPressed && styles.ctaPressed,
        isSubmitting && styles.ctaDisabled,
      ]}
    >
      {ctaHovered && !ctaPressed && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ctaHoverTint]} />
      )}
      {ctaPressed && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ctaPressTint]} />
      )}
      <View style={styles.ctaInner}>
        <Text
          style={[dsText('button', DS_COLORS.onAction), isSubmitting && styles.ctaTextLoading]}
        >
          {t('main:dayCard.cta')}
        </Text>
        <Chevron size={18} color={DS_COLORS.onAction} />
      </View>
    </Animated.View>
  );

  const textBlock = (
    <View style={styles.textCol}>
      <Animated.Text style={[dsText('display', DS_COLORS.ink50), titleAnimatedStyle]}>
        {t('core:dailyCard.title')}
      </Animated.Text>
      <Animated.View style={[styles.dateLeadGroup, textAnimatedStyle]}>
        <Text style={[dsText('micro', DS_COLORS.ink100), styles.dateText]}>{dateLabel}</Text>
        <Text style={dsText('lead', DS_COLORS.ink100)}>{t('main:dayCard.lead')}</Text>
      </Animated.View>
    </View>
  );

  return (
    <Pressable
      onLayout={handleSurfaceLayout}
      onPress={handleSelectDayAdvice}
      onFocus={onFocus}
      onBlur={onBlur}
      onHoverIn={() => setCtaHovered(true)}
      onHoverOut={() => setCtaHovered(false)}
      onPressIn={() => setCtaPressed(true)}
      onPressOut={() => setCtaPressed(false)}
      disabled={isSubmitting}
      accessibilityRole="button"
      accessibilityLabel={t('main:dayCard.a11y', { date: dateLabel })}
      accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      style={({ hovered }: PressableWebState) => [
        styles.surface,
        Platform.OS === 'web' ? (reducedMotion ? dsWebTransitionReduced : dsWebTransition) : null,
        {
          borderRadius: windowRadius,
          borderColor: hovered ? DS_COLORS.accent400 : DS_COLORS.ground600,
        },
        focusVisible && dsFocusRing,
      ]}
    >
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no"
        style={[StyleSheet.absoluteFill, { backgroundColor: DS_COLORS.ground800, borderRadius: windowRadius }]}
      />

      {isDesktop ? (
        <View style={styles.rowLayout}>
          <View style={[styles.desktopContent, { padding: contentPadding }]}>
            {textBlock}
            {button}
          </View>
          <View style={[styles.desktopImageCol, { width: '40%' as const }]}>
            {surfaceSize.height > 0 && (
              <Image
                source={getImage(['core', 'girl'])}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: imageColWidth,
                  height: surfaceSize.height,
                }}
                resizeMode="cover"
                accessible={false}
                importantForAccessibility="no"
              />
            )}
            {surfaceSize.height > 0 && (
              <Svg
                width={imageColWidth}
                height={surfaceSize.height}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                <Polygon
                  points={`0,0 ${tilt},0 0,${surfaceSize.height} 0,${surfaceSize.height}`}
                  fill={DS_COLORS.ground800}
                />
                <AnimatedAscendingRail
                  width={imageColWidth}
                  height={surfaceSize.height}
                  tilt={tilt}
                  progress={edgeProgress}
                />
              </Svg>
            )}
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.stackedImageWrap, { height: stackedGeometry.leftY || undefined }]}>
            {surfaceSize.width > 0 && (
              <Image
                source={getImage(['core', 'girl'])}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: surfaceSize.width,
                  height: stackedGeometry.leftY,
                }}
                resizeMode="cover"
                accessible={false}
                importantForAccessibility="no"
              />
            )}
          </View>
          {surfaceSize.width > 0 && (
            <HeroCutEdge geometry={stackedGeometry} progress={edgeProgress} />
          )}
          <View
            style={[
              styles.stackedContent,
              {
                paddingTop: stackedGeometry.leftY + DS_SPACE.l,
                paddingBottom: contentPadding,
                paddingLeft: contentPadding,
                paddingRight: contentPadding,
              },
            ]}
          >
            {textBlock}
            <View style={{ marginTop: contentPadding }}>{button}</View>
          </View>
        </>
      )}
    </Pressable>
  );
}

function AnimatedAscendingRail({
  width,
  height,
  tilt,
  progress,
}: {
  width: number;
  height: number;
  tilt: number;
  progress: SharedValue<number>;
}) {
  const lineLength = Math.max(1, Math.hypot(tilt, height));
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - progress.value) * lineLength,
  }));

  return (
    <AnimatedLine
      x1={tilt}
      y1={0}
      x2={0}
      y2={height}
      stroke={DS_COLORS.accent400}
      strokeWidth={DS_SIZES.edgeWidth}
      strokeDasharray={`${lineLength}`}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  desktopContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: DS_SPACE.s,
  },
  desktopImageCol: {
    position: 'relative',
    overflow: 'hidden',
  },
  stackedImageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  stackedContent: {
    width: '100%',
  },
  textCol: {
    gap: DS_SPACE.s,
  },
  dateLeadGroup: {
    gap: DS_SPACE.xs,
  },
  dateText: {
    marginTop: 2,
  },
  ctaBase: {
    height: DS_SIZES.buttonHeight,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: DS_COLORS.action500,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaFull: {
    width: '100%',
  },
  ctaInline: {
    alignSelf: 'flex-start',
  },
  ctaPressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  ctaDisabled: {
    opacity: 0.85,
  },
  ctaHoverTint: {
    backgroundColor: HOVER_TINT,
  },
  ctaPressTint: {
    backgroundColor: DS_COLORS.pressDim,
  },
  ctaTextLoading: {
    opacity: 0.6,
  },
  ctaInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS_SPACE.s,
    paddingHorizontal: DS_SPACE.xl,
  },
});

export default DayAdvice;
