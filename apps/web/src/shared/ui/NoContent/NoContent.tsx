import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
      <Image
        resizeMode="contain"
        style={styles.image}
        source={getImage(['core', 'notFound'])}
      />
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
  image: {
    width: '100%',
    height: 300,
  },
  button: {
    width: '100%',
    maxWidth: 400,
  },
});

export default NoContent;
