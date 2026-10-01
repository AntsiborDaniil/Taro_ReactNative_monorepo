import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { getImage } from 'shared/lib';
import { DS_COLORS, DS_MOTION, dsWebTransition, dsWebTransitionReduced } from 'shared/themes/ds';
import { getColorOpacity } from 'shared/themes';
import { LoadingsContext } from '../../contexts/Loadings';
import { useData } from '../../DataProvider';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';

const LOADING_SEGMENTS = 4;
const LOADING_SEGMENT_STEP = DS_MOTION.block;

/** Спокойный индикатор ожидания: сегменты грани accent400, смена opacity по кругу. Reduced motion — статично. */
function LoadingSegments() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % LOADING_SEGMENTS);
    }, LOADING_SEGMENT_STEP);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const webTransition = reducedMotion ? dsWebTransitionReduced : dsWebTransition;

  return (
    <View style={styles.segments} accessibilityElementsHidden>
      {Array.from({ length: LOADING_SEGMENTS }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            Platform.OS === 'web' ? webTransition : null,
            {
              opacity: reducedMotion ? 0.55 : index === activeIndex ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const LOADING_TEXTS = [
  'loading.1',
  'loading.2',
  'loading.3',
  'loading.4',
  'loading.5',
];

const vibrationPattern = [
  { type: 'impact', style: ImpactFeedbackStyle.Light, duration: 100 }, // Легкая вибрация
  { wait: 200 }, // Пауза
  { type: 'impact', style: ImpactFeedbackStyle.Medium, duration: 200 }, // Средняя вибрация
  { wait: 300 }, // Пауза
  { type: 'impact', style: ImpactFeedbackStyle.Heavy, duration: 300 }, // Тяжелая вибрация
  { wait: 400 }, // Более длинная пауза
];

async function vibrateCycle() {
  for (const step of vibrationPattern) {
    if (step.type === 'impact') {
      await impactAsync(step.style);
      await new Promise((resolve) => setTimeout(resolve, step.duration));
    } else if (step.wait) {
      await new Promise((resolve) => setTimeout(resolve, step.wait));
    }
  }
}

function AIAnimation({ hasVibration }: { hasVibration?: boolean }) {
  const [selectedLoadingText, setSelectedLoadingText] = useState<string>(
    LOADING_TEXTS[0]
  );

  const { isFullScreenLoading } = useData({ Context: LoadingsContext });

  const { t } = useTranslation(['core']);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedLoadingText(
        LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const videoSource = useMemo(
    () => (Math.random() < 0.2 ? 'loaderCar' : 'loader'),
    []
  );

  const videoProp = useMemo(() => {
    if (Platform.OS === 'web') {
      // Served from apps/web/public/videos (avoids Metro asset id / Image internals on web)
      return {
        uri: videoSource === 'loaderCar' ? '/videos/loaderCar.mp4' : '/videos/loader.mp4',
      };
    }
    return getImage(['videos', videoSource]);
  }, [videoSource]);

  useEffect(() => {
    if (!hasVibration || !isFullScreenLoading) {
      return;
    }

    const vibrationTimeout = setInterval(async () => await vibrateCycle(), 300);

    return () => clearInterval(vibrationTimeout);
  }, [hasVibration, isFullScreenLoading]);

  if (!isFullScreenLoading) {
    return null;
  }

  return (
    <>
      <Video
        style={styles.video}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
        ignoreSilentSwitch="obey"
        source={videoProp}
        controls={false}
        controlsStyles={{
          hidePosition: true,
          hidePlayPause: true,
          hideForward: true,
          hideRewind: true,
          hideNext: true,
          hidePrevious: true,
          hideFullscreen: true,
          hideSeekBar: true,
          hideDuration: true,
          hideNavigationBarOnFullScreenMode: true,
          hideNotificationBarOnFullScreenMode: true,
          hideSettingButton: true,
        }}
      />
      <View
        style={styles.overlay}
        {...(Platform.OS === 'web'
          ? ({ 'data-tarot-no-swipe-back': true } as object)
          : {})}
      >
        <View style={styles.card}>
          <View style={styles.cardInner}>
            <LoadingSegments />
            <Text
              category={TEXT_TAGS.h4}
              weight={TEXT_WEIGHT.medium}
              style={styles.title}
            >
              {`${t('loading.default')}...`}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.subtitle}>
              {t(selectedLoadingText)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: getColorOpacity(DS_COLORS.ground900, 80),
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
  },
  cardInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: DS_COLORS.ink50,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    color: DS_COLORS.ink100,
    textAlign: 'center',
    lineHeight: 22,
  },
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segment: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS_COLORS.accent400,
  },
});

export default AIAnimation;
