import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Layout } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { TarotCardReadingsDefault } from 'features/TarotCardReadings';
import { TarotCardDirection, tarotCards } from 'shared/api';
import { TNavigationParams } from 'shared/hooks';
import { getTarotCardReadings } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NoContent, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

export default function DetailCard() {
  const [direction, setDirection] = useState<TarotCardDirection>(
    TarotCardDirection.Upright
  );

  const { t } = useTranslation();

  const route = useRoute<RouteProp<TNavigationParams>>(); // Получаем объект маршрута
  const { id } = route.params || {};

  const card = tarotCards[id ?? ''] || null;

  if (!card) {
    return (
      <ScreenLayout>
        <Header title="" />
        <NoContent
          title={t('core:stub.missingData.title')}
          buttonText={t('core:stub.missingData.button')}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Header title={t(card.name)} />
      <ScrollView>
        <Layout
          style={{
            height: '100%',
            gap: 16,
            paddingBottom: 32,
          }}
        >
          <SafeAreaView style={styles.direction}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setDirection(TarotCardDirection.Upright)}
            >
              <Text
                category={TEXT_TAGS.h3}
                style={
                  direction === TarotCardDirection.Upright
                    ? styles.selected
                    : undefined
                }
              >
                {t('core:card.upright')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setDirection(TarotCardDirection.Reversed)}
            >
              <Text
                category={TEXT_TAGS.h3}
                style={
                  direction === TarotCardDirection.Reversed
                    ? styles.selected
                    : undefined
                }
              >
                {t('core:card.reversed')}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
          <TarotCardReadingsDefault
            card={getTarotCardReadings({
              card,
              keys: ['keywords', 'description'],
              direction,
            })}
          />
        </Layout>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  direction: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-evenly',
  },
  selected: {
    color: COLORS.Primary,
  },
});
