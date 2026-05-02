import { ReactElement, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { Button, NoContent, ScreenLayout, TarotCard, Text, TEXT_TAGS } from 'shared/ui';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LikeCard } from 'entities/favorites';
import { MotivationContext } from 'entities/tarotMotivation';
import { TarotCharacteristics } from 'features/TarotCardReadings/ui/TarotCharacteristics';
import TarotMeanings from 'features/TarotCardReadings/ui/TarotMeanings/TarotMeanings';
import { useNativeNavigation } from 'shared/hooks';
import { LeafIcon, ReverseIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { TarotCardDirection } from '../../../shared/api';

export type MoticationScreenScreenProps = {};

const HORIZONTAL_PAD = 20;

function MoticationScreen(
  _props: MoticationScreenScreenProps
): ReactElement {
  const [titleLayout, setTitleLayout] = useState({ width: 0, height: 0 });

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { sceneContentWidth } = useTabRailLayout();

  const navigation = useNativeNavigation();

  const { selectedMotivation } = useData({ Context: MotivationContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const card = selectedMotivation?.cards[0];

  const innerWidth = Math.max(
    1,
    sceneContentWidth - HORIZONTAL_PAD * 2
  );

  const { cardWidth, cardHeight } = useMemo(() => {
    const w = Math.min(320, Math.max(200, Math.round(innerWidth * 0.52)));
    const h = Math.round((w * 16) / 9);
    return { cardWidth: w, cardHeight: h };
  }, [innerWidth]);

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

  const splittedTitle = t(card.name).split(' ');
  const middleIndex = Math.floor(splittedTitle.length / 2);

  const resultedTitle =
    titleLayout.width > 0 &&
    sceneContentWidth - titleLayout.width < 40
      ? `${splittedTitle.slice(0, middleIndex).join(' ')}\n${splittedTitle.slice(middleIndex).join(' ')}`
      : t(card.name);

  const handleTitleLayout = (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    if (titleLayout.width !== 0) {
      return;
    }
    setTitleLayout({ width: w, height: h });
  };

  return (
    <ScreenLayout>
      <View style={styles.headerZone}>
        <Header title="" />
      </View>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(28, insets.bottom + 20) },
        ]}
      >
        <View
          style={[
            styles.scene,
            {
              maxWidth: sceneContentWidth,
              paddingHorizontal: HORIZONTAL_PAD,
            },
          ]}
        >
          <View style={styles.hero}>
            <SafeAreaView style={styles.imageWrapper}>
              <Pressable
                accessibilityRole="image"
                accessibilityLabel={t(card.name)}
                onPress={async () => handleVibrationClick?.()}
                style={({ pressed }) => [
                  styles.cardPressable,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    maxWidth: '100%',
                    alignSelf: 'center',
                  },
                  pressed && styles.cardPressablePressed,
                ]}
              >
                <TarotCard
                  width={cardWidth}
                  height={cardHeight}
                  imageResizeMode="contain"
                  styleCard={{
                    width: cardWidth,
                    height: cardHeight,
                    maxWidth: '100%',
                    alignSelf: 'center',
                    ...(Platform.OS === 'web'
                      ? ({
                          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                          cursor: 'pointer',
                        } as object)
                      : {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.35,
                          shadowRadius: 16,
                          elevation: 12,
                        }),
                  }}
                  cardId={card.id}
                  direction={card.direction}
                />
              </Pressable>
            </SafeAreaView>

            <View style={styles.titleBlock}>
              <View style={styles.titleContainer} onLayout={handleTitleLayout}>
                <LeafIcon
                  fill={COLORS.Primary}
                  width={28}
                  height={28}
                  style={styles.leftLeaf}
                />
                <Text category={TEXT_TAGS.h2} style={styles.title}>
                  {resultedTitle}
                </Text>
                <LeafIcon fill={COLORS.Primary} width={28} height={28} />
                <LikeCard
                  card={card}
                  onAdditionalPress={async () => await handleVibrationClick?.()}
                />
              </View>
              {card.direction === TarotCardDirection.Reversed && (
                <View style={styles.reversedContainer}>
                  <Text category={TEXT_TAGS.h3} style={styles.reversedLabel}>
                    {t('spread:reverseCard')}
                  </Text>
                  <ReverseIcon width={22} height={22} style={styles.reverseIcon} />
                </View>
              )}
            </View>
          </View>

          <TarotCharacteristics card={card} />

          <View style={styles.footerBlock}>
            <TarotMeanings
              card={card}
              interpretation={selectedMotivation?.interpretation}
            />
            <Button
              style={styles.doneButton}
              onPress={() => {
                navigation.navigate(TabRoute.MainTab, {
                  screen: NavigationRoute.Main,
                });
              }}
            >
              {t('core:finish')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerZone: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    zIndex: 2,
    backgroundColor: COLORS.Background,
  },
  scroll: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
    paddingTop: 4,
  },
  scene: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: 14,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPressable: {
    borderRadius: 14,
    overflow: 'visible',
  },
  cardPressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  leftLeaf: {
    transform: [{ scaleX: -1 }],
  },
  titleBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  title: {
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  reversedContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  reversedLabel: {
    textAlign: 'center',
  },
  reverseIcon: {
    marginBottom: 2,
  },
  footerBlock: {
    width: '100%',
    alignItems: 'stretch',
    gap: 20,
    marginTop: 4,
  },
  doneButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default MoticationScreen;
