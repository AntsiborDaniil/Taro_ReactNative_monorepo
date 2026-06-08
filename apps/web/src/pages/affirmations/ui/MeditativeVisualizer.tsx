import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Canvas,
  LinearGradient,
  Path,
  Skia,
  SkPath,
  usePathValue,
  vec,
} from '@shopify/react-native-skia';
import {
  AffirmationsContext,
  getAffirmationItemsForCategory,
} from 'entities/affirmations';
import { useTranslation } from 'react-i18next';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useData } from 'shared/DataProvider';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

const DEFAULT_PALETTE = ['#667eea', '#764ba2'];

type MeditativeVisualizerProps = {
  visualSize: number;
};

function MeditativeVisualizer({ visualSize }: MeditativeVisualizerProps) {
  const SIZE = visualSize;

  const { selectedAffirmation, selectedAffirmationCategory } = useData({
    Context: AffirmationsContext,
  });

  const { t } = useTranslation();

  const gradient = selectedAffirmation?.colors?.colors ?? DEFAULT_PALETTE;

  const breath = useSharedValue(0);
  const morph = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    morph.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    colorProgress.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  function getPath({
    path,
    breathScaleValues,
    wavesScale,
    radiusScale,
    baseRMultiplier,
  }: {
    path: SkPath;
    baseRMultiplier: number;
    breathScaleValues: {
      base: number;
      multiplier: number;
    };
    wavesScale: {
      sin: number;
      cos: number;
    };
    radiusScale: {
      x: number;
      y: number;
    };
  }) {
    'worklet';

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const baseR = SIZE * baseRMultiplier;

    const breathScale =
      breathScaleValues.base +
      Math.sin(breath.value * Math.PI) * breathScaleValues.multiplier;
    const points = 128;

    path.reset();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;

      const wave =
        Math.sin(angle * 2 + morph.value * Math.PI * 2) * wavesScale.sin +
        Math.cos(angle * 3 + morph.value * Math.PI * 1.7) * wavesScale.cos;

      const r = baseR * breathScale * (1 + wave);

      const x = cx + Math.cos(angle) * r * radiusScale.x;
      const y = cy + Math.sin(angle) * r * radiusScale.y;

      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
  }

  const path1 = usePathValue((path) => {
    'worklet';
    getPath({
      path,
      breathScaleValues: {
        base: 0.85,
        multiplier: 0.15,
      },
      baseRMultiplier: 0.3,
      wavesScale: {
        sin: 0.05,
        cos: 0.03,
      },
      radiusScale: { x: 1.4, y: 1.4 },
    });
  }, Skia.Path.Make());

  const path2 = usePathValue((path) => {
    'worklet';

    getPath({
      path,
      breathScaleValues: {
        base: 0.9,
        multiplier: 0.12,
      },
      baseRMultiplier: 0.34,
      wavesScale: {
        sin: 0.04,
        cos: 0.025,
      },
      radiusScale: { x: 1.2, y: 1.4 },
    });
  }, Skia.Path.Make());

  const path3 = usePathValue((path) => {
    'worklet';

    getPath({
      path,
      breathScaleValues: {
        base: 0.95,
        multiplier: 0.12,
      },
      baseRMultiplier: 0.34,
      wavesScale: {
        sin: 0.025,
        cos: 0.025,
      },
      radiusScale: { x: 1.4, y: 1.3 },
    });
  }, Skia.Path.Make());

  const texts = getAffirmationItemsForCategory(
    t,
    selectedAffirmationCategory
  );

  const selectedTexts = texts.find(
    (item) => item.id === selectedAffirmation?.texts.id
  );

  const baseTextColor =
    selectedAffirmation?.colors?.texts?.base ?? COLORS.Content;
  const coloredTextColor =
    selectedAffirmation?.colors?.texts?.colored ?? COLORS.Primary;
  const affirmationFontSize = Math.round(Math.max(18, Math.min(34, SIZE * 0.055)));
  const affirmationLineHeight = Math.round(affirmationFontSize * 1.26);

  return (
    <Pressable
      key={SIZE}
      accessibilityRole="button"
      accessibilityLabel={t('affirmations:focusArea')}
      style={(state) => [
        styles.container,
        { width: SIZE, height: SIZE },
        (state as { hovered?: boolean }).hovered && styles.containerHovered,
        state.pressed && styles.containerPressed,
      ]}
    >
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />
      <Canvas style={{ width: SIZE, height: SIZE + 100 }}>
        <Path path={path3} opacity={0.2}>
          <LinearGradient
            start={vec(SIZE * 0.4, SIZE * 0.1)}
            end={vec(SIZE * 0.8, SIZE * 0.9)}
            colors={gradient}
          />
        </Path>

        <Path path={path2} opacity={0.4}>
          <LinearGradient
            start={vec(SIZE * 0.3, SIZE * 0.3)}
            end={vec(SIZE * 0.7, SIZE * 0.7)}
            colors={gradient}
          />
        </Path>
        <Path path={path1}>
          <LinearGradient
            start={vec(SIZE * 0.4, SIZE * 0.2)}
            end={vec(SIZE * 0.8, SIZE * 0.8)}
            colors={gradient}
          />
        </Path>
      </Canvas>

      <View style={styles.texts}>
        {selectedTexts?.text?.map((item, index) => (
          <Text
            category={TEXT_TAGS.h3}
            weight={item.colored ? TEXT_WEIGHT.semibold : TEXT_WEIGHT.medium}
            style={[
              styles.affirmationText,
              {
                fontSize: affirmationFontSize,
                lineHeight: affirmationLineHeight,
                color: item.colored ? coloredTextColor : baseTextColor,
              },
              item.colored && styles.affirmationTextAccent,
            ]}
            key={`${item.content}-${index}`}
          >
            {item.content}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
    ...({
      boxShadow: '0 14px 34px rgba(0,0,0,0.24)',
      ...WEB_HOVER_TRANSITION,
    } as object),
  },
  containerHovered: {
    ...({
      boxShadow: '0 18px 40px rgba(0,0,0,0.30)',
    } as object),
  },
  containerPressed: {
    opacity: 0.96,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    zIndex: 1,
    opacity: 0.2,
    pointerEvents: 'none',
  },
  glowLeft: {
    left: -36,
    top: 26,
    backgroundColor: '#7A7DFF',
  },
  glowRight: {
    right: -40,
    bottom: 56,
    backgroundColor: '#49D3C6',
  },
  texts: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    alignItems: 'center',
    width: '84%',
    gap: 2,
  },
  affirmationText: {
    textAlign: 'center',
    letterSpacing: 0.25,
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 1px 10px rgba(0,0,0,0.35)' } as object)
      : {
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 10,
        }),
  },
  affirmationTextAccent: {
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 0 12px rgba(74, 225, 208, 0.42)' } as object)
      : {
          textShadowColor: 'rgba(74, 225, 208, 0.42)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        }),
  },
});

export default MeditativeVisualizer;
