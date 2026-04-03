import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { getImage } from 'shared/lib';
import { LoadingsContext } from '../../contexts/Loadings';
import { useData } from '../../DataProvider';
import { Text } from '../Text';

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
      <View style={styles.textContainer}>
        <BlurView
          style={styles.blur}
          blurType="dark"
          blurAmount={1}
          reducedTransparencyFallbackColor="white"
        />
        <Text
          style={styles.text}
        >{`${t('loading.default')}.\n${t(selectedLoadingText)}...`}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    padding: 4,
    bottom: 48,
    left: 0,
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default AIAnimation;
