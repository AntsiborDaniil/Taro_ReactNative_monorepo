import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Layout } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { TarotCardReadingsDefault } from 'features/TarotCardReadings';
import { TarotCardDirection, tarotCards } from 'shared/api';
import { TNavigationParams, useScrollToTopFab } from 'shared/hooks';
import { getTarotCardReadings } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NoContent, ScreenLayout, ScrollToTopFab, Text, TEXT_TAGS } from 'shared/ui';

export default function DetailCard() {
  const [direction, setDirection] = useState<TarotCardDirection>(
    TarotCardDirection.Upright
  );

  const { t } = useTranslation();
  const { scrollRef, onScroll, scrollToTop } = useScrollToTopFab();

  const route = useRoute<RouteProp<TNavigationParams>>();
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
    <ScreenLayout style={styles.screen}>
      <View style={styles.page}>
        <Header title={t(card.name)} />
        <View style={styles.scrollHost}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <Layout style={styles.content}>
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
        </View>
        <ScrollToTopFab alwaysVisible onPress={scrollToTop} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
  },
  page: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  scrollHost: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 88,
  },
  content: {
    gap: 16,
    backgroundColor: 'transparent',
  },
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
