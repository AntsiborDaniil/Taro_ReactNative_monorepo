import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNativeNavigation } from '../../hooks';
import { getImage } from '../../lib';
import { NavigationRoute, TabRoute } from '../../types';
import { Button } from '../Button';
import { Text, TEXT_TAGS } from '../Text';

type NoContentProps = {
  title: string;
  /** Defaults to core:action.makeSpread */
  buttonText?: string;
  onPress?: () => void;
};

function NoContent({ title, onPress, buttonText }: NoContentProps) {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  return (
    <View style={styles.container}>
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
