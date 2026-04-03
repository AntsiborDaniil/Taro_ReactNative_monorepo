import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  InteractionManager,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LikeCard } from 'entities/favorites';
import { PressToUnlock, SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { LoremIpsum } from 'lorem-ipsum';
import { useTranslation } from 'react-i18next';
import {
  GestureHandlerRootView,
  GestureType,
  ScrollView,
} from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, {
  ICarouselInstance,
  Pagination,
} from 'react-native-reanimated-carousel';
import { SpreadName, SpreadsCategory, TarotCardDirection } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronLeftIcon, LeafIcon, ReverseIcon } from 'shared/icons';
import { moderateScale } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Button, TarotCard, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { rateAppAfterFinishedSpreads } from 'shared/utils';
import { PaidContent } from '../../../paidContent';
import { SpreadScheme } from '../../../scheme';
import { TarotCharacteristics } from '../TarotCharacteristics';
import TarotMeanings from '../TarotMeanings/TarotMeanings';

const screen = Dimensions.get('screen');

const NAVIGATION_ROUTES: Record<TabRoute, NavigationRoute> = {
  [TabRoute.LibraryTab]: NavigationRoute.SpreadsHistory,
  [TabRoute.MainTab]: NavigationRoute.Main,
  [TabRoute.SpreadsTab]: NavigationRoute.Spreads,
};

type Props = {
  cardIndex?: string;
};

function TarotCardReadingsSpread({ cardIndex }: Props) {
  let isViewedLastCard = false;

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { isPractitioner } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const progress = useSharedValue<number>(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const carouselRef = useRef<ICarouselInstance>(null);
  const flatListRef = useRef<GestureType | undefined>(undefined);
  const navigation = useNativeNavigation();

  const viewNextCard = async () => {
    await handleVibrationClick?.();

    carouselRef.current?.next();
  };

  const viewPrevCard = async () => {
    await handleVibrationClick?.();

    carouselRef.current?.prev();
  };

  const { spread, handleGetAIInterpretation } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const hasSummary = !spread || spread.category !== SpreadsCategory.Simple;

  const cardsCount = (spread?.cardsCount ?? 0) + (hasSummary ? 1 : 0);

  const handleDone = async () => {
    await handleVibrationClick?.();

    if (!selectedTab) {
      return;
    }

    navigation.navigate(selectedTab, {
      screen: NAVIGATION_ROUTES[selectedTab],
    });

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        rateAppAfterFinishedSpreads().catch(() => {});
      }, 1000);
    });
  };

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  const handlePressToUnlock = async () => {
    await handleVibrationClick?.();

    if (isPractitioner) {
      handleGetAIInterpretation?.();

      return;
    }

    showModal?.(<PaidContent />);
  };

  useEffect(() => {
    if (typeof cardIndex === 'undefined') {
      return;
    }

    carouselRef.current?.scrollTo({
      count: Number(cardIndex),
    });
  }, [cardIndex]);

  const { t } = useTranslation();

  const currentIndex = carouselRef.current?.getCurrentIndex();

  useEffect(() => {
    if (cardsCount && !isViewedLastCard && currentIndex === cardsCount - 1) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isViewedLastCard = true;

      if (spread) {
        AppMetrica.reportEvent(AnalyticAction.ShowLastCardSpread, {
          spread: spread.name,
        });
      }
    }
  }, [currentIndex]);

  if (!spread) {
    return null;
  }

  const interpretation =
    spread.interpretation ||
    new LoremIpsum({
      sentencesPerParagraph: {
        max: 6,
        min: 4,
      },
      wordsPerSentence: {
        max: 15,
        min: 10,
      },
    }).generateParagraphs(3);

  const carouselData = spread?.selectedCards
    ? hasSummary
      ? [{}, ...spread.selectedCards]
      : spread.selectedCards
    : [];

  return (
    <GestureHandlerRootView>
      {spread.category !== SpreadsCategory.Simple && (
        <Pagination.Basic
          progress={progress}
          data={carouselData}
          dotStyle={{
            width: screen.width / cardsCount - 4 - 16 / (cardsCount - 2),
            height: 8,
            borderRadius: 6,
            backgroundColor: COLORS.SpbSky3,
          }}
          activeDotStyle={{
            overflow: 'hidden',
            borderRadius: 6,
            backgroundColor: COLORS.Primary,
          }}
          containerStyle={{
            gap: 4,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          horizontal
          onPress={onPressPagination}
        />
      )}
      <Carousel
        ref={carouselRef}
        data={carouselData}
        onProgressChange={progress}
        vertical={false}
        loop={false}
        onConfigurePanGesture={(gesture) => {
          'worklet';
          gesture.activeOffsetX([-10, 10]);
          gesture.activeOffsetY([-1000, 1000]);
          gesture.simultaneousWithExternalGesture(flatListRef);
        }}
        width={screen.width}
        renderItem={({ index }) => {
          const card = spread?.selectedCards?.[index - (hasSummary ? 1 : 0)];

          const isFirstCard = index < 1;
          const isLastCard = index === cardsCount - 1;

          if (!card) {
            return (
              <ScrollView key={index} style={styles.summaryWrapper}>
                <SafeAreaView style={styles.content}>
                  <View style={styles.contentInner}>
                    <View style={styles.paddingWrapper}>
                      <Text category={TEXT_TAGS.h3} style={styles.orderMeaning}>
                        {t('spread:summaryTitle')}
                      </Text>
                    </View>
                    <View style={styles.spreadSchemeContainer}>
                      <SpreadScheme hasRotation={false} isChoicePage />
                    </View>
                    <View style={styles.paddingWrapper}>
                      <TouchableOpacity
                        style={styles.summaryContainer}
                        onPress={handlePressToUnlock}
                        activeOpacity={1}
                      >
                        <Text style={styles.summaryText} key="meaning">
                          {interpretation ?? ''}
                        </Text>
                        {!spread?.interpretation && <PressToUnlock />}
                      </TouchableOpacity>

                      {!!spread?.cardsOrder?.length && (
                        <View style={styles.buttons}>
                          <Button
                            style={isFirstCard ? styles.hidden : null}
                            disabled={isFirstCard}
                            onPress={viewPrevCard}
                          >
                            {t('core:button.prev')}
                          </Button>
                          <Button
                            style={isLastCard ? styles.hidden : null}
                            disabled={isLastCard}
                            onPress={viewNextCard}
                          >
                            {t('core:button.next')}
                          </Button>
                        </View>
                      )}

                      {isLastCard && (
                        <View>
                          <Button
                            style={styles.doneButton}
                            onPress={handleDone}
                          >
                            {t('core:finish')}
                          </Button>
                        </View>
                      )}
                    </View>
                  </View>
                </SafeAreaView>
              </ScrollView>
            );
          }

          const { width } = Dimensions.get('window');

          const handleLayout = (event: any) => {
            const { width, height } = event.nativeEvent.layout;

            if (dimensions.width !== 0) {
              return;
            }

            setDimensions({ width, height });
          };

          const splittedTitle = t(card.name).split(' ');

          const middleIndex = Math.floor(splittedTitle.length / 2);

          const resultedTitle =
            width - dimensions.width < 32
              ? `${splittedTitle.slice(0, middleIndex).join(' ')}\n${splittedTitle.slice(middleIndex).join(' ')}`
              : t(card.name);

          return (
            <ScrollView key={index}>
              <SafeAreaView style={styles.content}>
                <View style={styles.contentInner}>
                  <View style={styles.paddingWrapper}>
                    {!!spread?.cardsOrder?.length && (
                      <Text category={TEXT_TAGS.h3} style={styles.orderMeaning}>
                        {t(
                          `spread:${spread?.cardsOrder?.[index - (hasSummary ? 1 : 0)]?.meaning ?? ''}`
                        )}
                      </Text>
                    )}

                    <SafeAreaView style={styles.navigationContainer}>
                      <ChevronLeftIcon
                        width={70}
                        height={70}
                        style={styles.chevron}
                        strokeOpacity={isFirstCard ? 0 : 1}
                        onPress={isFirstCard ? undefined : viewPrevCard}
                      />
                      <TarotCard cardId={card?.id} direction={card.direction} />
                      <ChevronLeftIcon
                        width={70}
                        height={70}
                        style={styles.rightChevron}
                        strokeOpacity={isLastCard ? 0 : 1}
                        onPress={isLastCard ? undefined : viewNextCard}
                      />
                    </SafeAreaView>
                    {spread?.id === SpreadName.Simple_YesNo && (
                      <Text category={TEXT_TAGS.h2} style={styles.title}>
                        {t(card.yesNo)}
                      </Text>
                    )}
                    <View style={styles.namesContainer}>
                      <View
                        style={styles.titleContainer}
                        onLayout={handleLayout}
                      >
                        <LeafIcon
                          fill={COLORS.Primary}
                          width={30}
                          height={30}
                          style={styles.leftLeaf}
                        />
                        <Text category={TEXT_TAGS.h2} style={styles.title}>
                          {resultedTitle}
                        </Text>
                        <LeafIcon
                          fill={COLORS.Primary}
                          width={30}
                          height={30}
                        />
                        <LikeCard
                          card={card}
                          onAdditionalPress={async () =>
                            await handleVibrationClick?.()
                          }
                        />
                      </View>
                      {card.direction === TarotCardDirection.Reversed && (
                        <View style={styles.reversedContainer}>
                          <Text category={TEXT_TAGS.h3} style={styles.title}>
                            {t('spread:reverseCard')}
                          </Text>
                          <ReverseIcon
                            width={24}
                            height={24}
                            style={{ marginBottom: 2 }}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  <TarotCharacteristics card={card} />

                  <View style={styles.paddingWrapper}>
                    <TarotMeanings
                      card={card}
                      interpretation={
                        spread?.id === SpreadName.Simple_YesNo
                          ? interpretation
                          : null
                      }
                      hasBlur={!spread?.interpretation}
                      onPressInterpretation={handlePressToUnlock}
                    />

                    {!!spread?.cardsOrder?.length && (
                      <View style={styles.buttons}>
                        <Button
                          style={isFirstCard ? styles.hidden : null}
                          disabled={isFirstCard}
                          onPress={viewPrevCard}
                        >
                          {t('core:button.prev')}
                        </Button>
                        <Button
                          style={isLastCard ? styles.hidden : null}
                          disabled={isLastCard}
                          onPress={viewNextCard}
                        >
                          {t('core:button.next')}
                        </Button>
                      </View>
                    )}

                    {isLastCard && (
                      <View>
                        <Button style={styles.doneButton} onPress={handleDone}>
                          {t('core:finish')}
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              </SafeAreaView>
            </ScrollView>
          );
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  paddingWrapper: {
    paddingHorizontal: 16,
    gap: 20,
  },
  content: {
    gap: 20,
    paddingBottom: 32,
    marginBottom: 32,
  },
  summaryWrapper: {
    position: 'relative',
  },
  title: {
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  hidden: {
    opacity: 0,
  },
  summaryText: {
    color: COLORS.Background,
    lineHeight: moderateScale(24),
    textAlign: 'left',
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  namesContainer: { marginTop: 16, marginBottom: 16 },
  contentInner: {
    gap: 20,
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  doneButton: {
    color: COLORS.Background,
  },
  orderMeaning: {
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: COLORS.Primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  chevron: {
    width: 70,
    height: 70,
  },
  spreadSchemeContainer: {
    paddingHorizontal: 16,
  },
  rightChevron: {
    transform: [{ rotate: '180deg' }],
  },
  leftLeaf: {
    transform: [{ scaleX: -1 }],
  },
  reversedContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TarotCardReadingsSpread;
