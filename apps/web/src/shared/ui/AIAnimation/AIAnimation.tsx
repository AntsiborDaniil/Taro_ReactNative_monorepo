import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { LoadingsContext } from '../../contexts/Loadings';
import { useData } from '../../DataProvider';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';

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
        muted={true} // Отключить звук, если видео используется как фон
        repeat={true} // Зациклить воспроизведение
        resizeMode="cover" // Аналогично ImageBackground, растягивает видео
        rate={1.0} // Скорость воспроизведения
        ignoreSilentSwitch="obey"
        source={getImage(['videos', videoSource])}
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
      <View style={styles.overlay}>
        <View style={[styles.glow, styles.glowLeft]} />
        <View style={[styles.glow, styles.glowRight]} />
        <View style={styles.card}>
          <BlurView
            style={styles.blur}
            blurType="dark"
            blurAmount={8}
            reducedTransparencyFallbackColor="#131B2A"
          />
          <View style={styles.cardInner}>
            <ActivityIndicator size="small" color={COLORS.Primary} />
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
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(9, 14, 24, 0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    ...(
      Platform.OS === 'web'
        ? ({
            boxShadow: '0 18px 42px rgba(0,0,0,0.34)',
          } as object)
        : {}
    ),
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  cardInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 22, 34, 0.55)',
  },
  title: {
    color: COLORS.Content,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 22,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.2,
    pointerEvents: 'none',
  },
  glowLeft: {
    backgroundColor: '#4BA6E8',
    left: '20%',
    top: '38%',
  },
  glowRight: {
    backgroundColor: '#8F6AE5',
    right: '18%',
    bottom: '30%',
  },
});

export default AIAnimation;
