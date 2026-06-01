import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../themes';
import { useNativeNavigation } from '../../hooks';
import { getImage } from '../../lib';
import { NavigationRoute, TabRoute } from '../../types';
import { Button } from '../Button';
import { Text, TEXT_TAGS } from '../Text';

type NoContentProps = {
  title: string;
  buttonText?: string;
  onPress?: () => void;
  /** Вертикально по центру родителя с flex: 1 (экран расклада / совет дня). */
  centered?: boolean;
};

function NoContent({ title, onPress, buttonText, centered }: NoContentProps) {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  return (
    <View style={[styles.container, centered && styles.containerCentered]}>
      <Text style={styles.title} category={TEXT_TAGS.h3}>
        {title}
      </Text>
      <View style={styles.imageWrap}>
        <Image
          resizeMode="contain"
          style={styles.image}
          source={getImage(['core', 'notFound'])}
        />
      </View>
      <Button
        style={styles.button}
        onPress={() => {
          if (onPress) {
            onPress();

            return;
          }

          navigation.navigate(TabRoute.MainTab, {
            screen: NavigationRoute.Spreads,
          });
        }}
      >
        {buttonText ?? t('core:action.makeSpread')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 0,
    width: '100%',
  },
  title: { textAlign: 'center' },
  imageWrap: {
    width: '100%',
    maxWidth: 360,
    height: 300,
    borderRadius: 20,
    backgroundColor: COLORS.SpbSky4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  button: {
    width: '100%',
    maxWidth: 400,
  },
});

export default NoContent;
