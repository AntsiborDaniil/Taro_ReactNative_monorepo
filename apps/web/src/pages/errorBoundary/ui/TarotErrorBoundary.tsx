import { useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { useTranslation } from 'react-i18next';
import { getImage } from 'shared/lib';
import { DS_COLORS } from 'shared/themes/ds';
import { Button, Text, TEXT_TAGS } from 'shared/ui';

type TarotErrorBoundaryProps = {
  title?: string;
  error?: Error;
  resetError?: () => void;
};

export default function TarotErrorBoundary({
  error,
  resetError,
}: TarotErrorBoundaryProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const compact = width < 900;

  const handleGoBack = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      resetError?.();
      return;
    }

    try {
      await Linking.openURL('tarotmobile://');
    } catch (openUrlError) {
      AppMetrica.reportError(
        'Can not open deep link',
        (openUrlError as Error).message
      );
      resetError?.();
    }
  };

  useEffect(() => {
    if (!error) {
      return;
    }

    AppMetrica.reportError('Error Boundary', error?.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, compact ? styles.cardCompact : null]}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={getImage(['core', 'errorBoundary'])}
        />
        <Text category={TEXT_TAGS.h2} style={styles.cardTitle}>
          {t('core:errorBoundary.title')}
        </Text>
        <Text category={TEXT_TAGS.p1} style={styles.cardDescription}>
          Произошла техническая проблема. Мы уже получили отчёт и работаем над
          исправлением.
        </Text>
        <Button style={styles.goBackButton} onPress={handleGoBack}>
          {t('core:button.prev')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: DS_COLORS.ground900,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    maxWidth: 220,
    height: 160,
    alignSelf: 'center',
  },
  /** Пустое состояние DS: плашка ground800, одна action-кнопка. */
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center',
    backgroundColor: DS_COLORS.ground800,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  cardCompact: {
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  cardTitle: {
    textAlign: 'center',
    color: DS_COLORS.ink50,
  },
  cardDescription: {
    textAlign: 'center',
    color: DS_COLORS.ink100,
  },
  goBackButton: {
    width: '100%',
    marginTop: 8,
  },
});
