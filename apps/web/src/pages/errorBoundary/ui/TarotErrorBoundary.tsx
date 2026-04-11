import { useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { useTranslation } from 'react-i18next';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';

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
      <View style={styles.imageFrame}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={getImage(['core', 'errorBoundary'])}
        />
      </View>
      <View style={styles.overlayAction}>
        <View style={styles.card}>
          <Text category={TEXT_TAGS.h2} style={styles.cardTitle}>
            {t('core:errorBoundary.title')}
          </Text>
          <Text
            category={TEXT_TAGS.h4}
            style={[
              styles.cardDescription,
              compact ? styles.cardDescriptionCompact : null,
            ]}
          >
            Произошла техническая проблема. Мы уже получили отчёт и работаем над
            исправлением.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('core:button.prev')}
            onPress={handleGoBack}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.goBackButton,
              Platform.OS === 'web' && hovered ? styles.goBackButtonHover : null,
              pressed ? styles.goBackButtonPressed : null,
            ]}
          >
            <Text category={TEXT_TAGS.h4} style={styles.goBackButtonText}>
              {t('core:button.prev')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.Background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFrame: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: '#0C1421',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 16px 42px rgba(0, 0, 0, 0.4)',
        } as object)
      : {}),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayAction: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 34,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: 'rgba(9, 15, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(6px)',
          boxShadow: '0 14px 34px rgba(0, 0, 0, 0.38)',
        } as object)
      : {}),
  },
  cardTitle: {
    textAlign: 'left',
    color: COLORS.Content,
    fontSize: 34,
    lineHeight: 38,
  },
  cardDescription: {
    textAlign: 'left',
    color: COLORS.SpbSky1,
    fontSize: 18,
    lineHeight: 24,
    maxWidth: 560,
  },
  cardDescriptionCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  goBackButton: {
    alignSelf: 'flex-start',
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition:
            'transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease',
          boxShadow: '0 8px 22px rgba(246, 192, 27, 0.32)',
        } as object)
      : {}),
  },
  goBackButtonHover: {
    backgroundColor: '#FFD24D',
    ...(Platform.OS === 'web'
      ? ({
          transform: 'translateY(-1px)',
          boxShadow: '0 12px 26px rgba(246, 192, 27, 0.45)',
        } as object)
      : {}),
  },
  goBackButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  goBackButtonText: {
    color: COLORS.Background,
  },
});
