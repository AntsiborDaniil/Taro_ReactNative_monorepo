import { useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertIcon } from 'shared/icons';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Button, Text, TEXT_TAGS } from 'shared/ui';

type TarotErrorBoundaryProps = {
  title?: string;
  error?: Error;
  resetError?: () => void;
};

export default function TarotErrorBoundary({
  title,
  error,
  resetError,
}: TarotErrorBoundaryProps) {
  const { top } = useSafeAreaInsets();

  const { t } = useTranslation();

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[TarotErrorBoundary]', error);
    }
  }, [error]);

  const handleClickUpgrade = async () => {
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6749576474'
        : 'https://play.google.com/store/apps/details?id=com.melexp.tarotmobile';

    try {
      const supported = await Linking.canOpenURL(storeUrl);

      if (supported) {
        await Linking.openURL(storeUrl);
      }
    } catch (openUrlError) {
      AppMetrica.reportError(
        'Can not open URL',
        (openUrlError as Error).message
      );
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
    <SafeAreaView style={styles.wrapper}>
      <View style={[styles.container, { top }]}>
        <View style={styles.action}>
          <View style={styles.warning}>
            <AlertIcon style={styles.icon} />
            <View style={styles.textBlock}>
              <Text category={TEXT_TAGS.h1}>
                {title ? t(title) : t('core:errorBoundary.title')}
              </Text>
              <Text category={TEXT_TAGS.h3}>
                {t('core:errorBoundary.description')}
              </Text>
            </View>
          </View>
          {__DEV__ && error && (
            <View style={styles.devError}>
              <Text category={TEXT_TAGS.label} style={styles.devErrorText}>
                {`${error.name}: ${error.message}`}
              </Text>
            </View>
          )}
          <Button
            onPress={() => {
              if (resetError) {
                resetError();
              } else {
                void handleClickUpgrade();
              }
            }}
            size="giant"
            appearance="outline"
            status="primary"
          >
            {t('core:errorBoundary.button')}
          </Button>
        </View>
        <Image
          style={styles.image}
          source={getImage(['core', 'errorBoundary'])}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.Background,
    height: '100%',
  },
  action: {
    height: '35%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 32,
  },
  icon: {
    // @ts-expect-error fill
    fill: COLORS.Primary,
    flexShrink: 0,
    width: 80,
    height: 80,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textBlock: {
    gap: 16,
    alignItems: 'flex-start',
  },
  container: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '65%',
  },
  devError: {
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  devErrorText: {
    color: '#ff6b6b',
    fontSize: 11,
  },
});
