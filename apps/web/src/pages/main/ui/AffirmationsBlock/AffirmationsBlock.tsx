import { useEffect } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNativeNavigation } from 'shared/hooks';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';

function AffirmationsBlock(): ReactElement {
  const { t } = useTranslation();

  const scale = useSharedValue(1);

  const navigation = useNativeNavigation();

  const isGlowing = true;

  // Создаем анимацию мерцания
  useEffect(() => {
    if (isGlowing) {
      scale.value = withRepeat(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1, // Бесконечное повторение
        true // Обратное направление
      );
    } else {
      scale.value = withTiming(1, { duration: 300 }); // Возвращаем к исходному размеру
    }
  }, [isGlowing]);

  // Анимированный стиль для фонового компонента
  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isGlowing ? 0.4 : 0, // Прозрачность фона в зависимости от isGlowing
  }));

  return (
    <View style={styles.container}>
      {/* Фоновый компонент с анимацией */}
      <Animated.View
        style={[
          styles.background,
          animatedBackgroundStyle,
          {
            backgroundColor: COLORS.Background,
            shadowColor: isGlowing ? COLORS.Primary : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 20,
            shadowOpacity: 1,
            elevation: isGlowing ? 10 : 0,
          }, // Цвет фона
        ]}
      />
      {/* Основной кликабельный компонент */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.block}
        onPress={() => {
          navigation.navigate(TabRoute.MainTab, {
            screen: NavigationRoute.Affirmations,
          });
        }}
      >
        <View style={styles.content}>
          <View style={styles.texts}>
            <Text category={TEXT_TAGS.h3}>
              {t('affirmations:affirmations')}
            </Text>
            <Text style={styles.caption} category={TEXT_TAGS.label}>
              {t('affirmations:hasAffirmation')}
            </Text>
          </View>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={getImage(['helloScreen', 'welcome'])}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  background: {
    top: 15,
    position: 'absolute',
    width: '84%',
    height: 90,
    borderRadius: 12,
  },
  block: {
    width: '100%',
    minHeight: 110,
    backgroundColor: COLORS.Background,
    borderWidth: 1,
    borderColor: COLORS.Primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Тень для основного блока, чтобы он выделялся
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    // position: 'absolute',
    resizeMode: 'contain',
    width: 80,
    height: 80,
  },
  content: {
    position: 'relative',
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  texts: {
    flex: 1,
  },
  caption: {
    color: COLORS.SpbSky1,
  },
});

export default AffirmationsBlock;
