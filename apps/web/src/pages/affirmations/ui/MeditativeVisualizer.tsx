import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  LinearGradient,
  Path,
  Skia,
  SkPath,
  usePathValue,
  vec,
} from '@shopify/react-native-skia';
import { AffirmationsContext, TAffirmationTexts } from 'entities/affirmations';
import { useTranslation } from 'react-i18next';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useData } from 'shared/DataProvider';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';

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

  const texts = t(
    `affirmations:affirmationsItems.${selectedAffirmationCategory}`,
    {
      returnObjects: true,
    }
  ) as TAffirmationTexts[];

  const selectedTexts = texts?.find(
    (item) => item.id === selectedAffirmation?.texts.id
  );

  const baseTextColor =
    selectedAffirmation?.colors?.texts?.base ?? COLORS.Content;
  const coloredTextColor =
    selectedAffirmation?.colors?.texts?.colored ?? COLORS.Primary;

  return (
    <View
      key={SIZE}
      style={[styles.container, { width: SIZE, height: SIZE }]}
    >
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
            style={{
              color: item.colored ? coloredTextColor : baseTextColor,
              textAlign: 'center',
            }}
            key={`${item.content}-${index}`}
          >
            {item.content}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    position: 'relative',
    alignSelf: 'center',
  },
  texts: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    alignItems: 'center',
  },
});

export default MeditativeVisualizer;
