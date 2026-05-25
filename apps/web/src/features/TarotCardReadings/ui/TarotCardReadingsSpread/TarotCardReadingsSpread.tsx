import { useEffect, useRef, useState } from 'react';
import {
  InteractionManager,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LikeCard } from 'entities/favorites';
import { PressToUnlock, SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { LoremIpsum } from 'lorem-ipsum';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, {
  ICarouselInstance,
  Pagination,
} from 'react-native-reanimated-carousel';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { SpreadName, SpreadsCategory, TarotCardDirection } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronLeftIcon, LeafIcon, ReverseIcon } from 'shared/icons';
import { moderateScale } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Button, NoContent, TarotCard, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { rateAppAfterFinishedSpreads } from 'shared/utils';
import { PaidContent } from '../../../paidContent';
import { SpreadScheme } from '../../../scheme';
import { TarotCharacteristics } from '../TarotCharacteristics';
import TarotMeanings from '../TarotMeanings/TarotMeanings';

const NAVIGATION_ROUTES: Record<TabRoute, NavigationRoute> = {
  [TabRoute.LibraryTab]: NavigationRoute.SpreadsHistory,
  [TabRoute.MainTab]: NavigationRoute.Main,
  [TabRoute.SpreadsTab]: NavigationRoute.Spreads,
};

type Props = {
  cardIndex?: string;
};

function TarotCardReadingsSpread({ cardIndex }: Props) {
  const DAY_CARD_DEBUG = '[DayCardFlow]';
  let isViewedLastCard = false;

  const { sceneContentWidth } = useTabRailLayout();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isPhone = windowWidth < 640;
  const tabBarHeight = useBottomTabBarHeight();
  const carouselWidth = sceneContentWidth;
  const reservedChrome = 200 + tabBarHeight;
  const [measuredCarouselHeight, setMeasuredCarouselHeight] = useState<
    number | null
  >(null);
  const fallbackCarouselHeight = Math.max(
    280,
    Math.floor(windowHeight - reservedChrome),
  );
  const carouselHeight = Math.max(
    220,
    measuredCarouselHeight ?? fallbackCarouselHeight,
  );

  const onCarouselSlotLayout = (event: LayoutChangeEvent) => {
    const h = Math.round(event.nativeEvent.layout.height);
    if (h < 1) {
      return;
    }
    setMeasuredCarouselHeight((prev) =>
      prev === null || Math.abs(prev - h) > 2 ? h : prev,
    );
  };

  useEffect(() => {
    setMeasuredCarouselHeight(null);
  }, [windowHeight, tabBarHeight, sceneContentWidth]);

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { isPractitioner } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const progress = useSharedValue<number>(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const carouselRef = useRef<ICarouselInstance>(null);
  const navigation = useNativeNavigation();

  const viewNextCard = async () => {
    await handleVibrationClick?.();

    carouselRef.current?.next();
  };

  const viewPrevCard = async () => {
    await handleVibrationClick?.();

    carouselRef.current?.prev();
  };

  const { spread, dayCardHydrated, handleGetAIInterpretation } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const hasSummary = !spread || spread.category !== SpreadsCategory.Simple;

  const cardsCount = (spread?.cardsCount ?? 0) + (hasSummary ? 1 : 0);

  useEffect(() => {
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} spreadReadings:layout`, {
        sceneContentWidth,
        windowHeight,
        carouselWidth,
        carouselHeight,
      });
    }
  }, [sceneContentWidth, windowHeight, carouselWidth, carouselHeight, tabBarHeight]);

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
  const { t: tCore } = useTranslation('core');

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

  if (!spread && !dayCardHydrated) {
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} spreadReadings:blankWhileHydrating`);
    }
    return <View style={styles.gestureRoot} />;
  }

  if (!spread) {
    if (__DEV__) {
      console.warn(`${DAY_CARD_DEBUG} spreadReadings:noSpreadAfterHydration`);
    }
    return (
      <View style={styles.gestureRoot}>
        <NoContent
          centered
          title={t('core:stub.missingData.title')}
          buttonText={t('core:stub.missingData.button')}
        />
      </View>
    );
  }

  if (
    spread.id === SpreadName.Simple_DaySuggest &&
    dayCardHydrated &&
    !spread.selectedCards?.length
  ) {
    if (__DEV__) {
      console.warn(`${DAY_CARD_DEBUG} spreadReadings:dayCardEmpty`, {
        spreadId: spread.id,
      });
    }
    return (
      <View style={styles.gestureRoot}>
        <NoContent
          centered
          title={t('core:dailyCard.empty.title')}
          buttonText={t('core:dailyCard.empty.button')}
          onPress={() =>
            navigation.navigate(TabRoute.MainTab, {
              screen: NavigationRoute.DayAdvice,
            })
          }
        />
      </View>
    );
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
    <View style={styles.gestureRoot}>
      {spread.category !== SpreadsCategory.Simple && (
        <Pagination.Basic
          progress={progress}
          data={carouselData}
          dotStyle={{
            width: carouselWidth / cardsCount - 4 - 16 / (cardsCount - 2),
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
        />
      )}
      <View
        style={styles.carouselA11yHost}
        onLayout={onCarouselSlotLayout}
        accessibilityLabel={tCore('a11y.horizontalList')}
        accessibilityHint={tCore('a11y.horizontalScrollHint')}
        {...(Platform.OS === 'web'
          ? ({ className: 'tarot-web-scroll-x' } as { className?: string })
          : {})}
      >
        <Carousel
          ref={carouselRef}
          data={carouselData}
          onProgressChange={progress}
          vertical={false}
          loop={false}
          width={carouselWidth}
          height={carouselHeight}
          style={styles.carousel}
          renderItem={({ index }) => {
          const card = spread?.selectedCards?.[index - (hasSummary ? 1 : 0)];

          const isFirstCard = index < 1;
          const isLastCard = index === cardsCount - 1;

          if (!card) {
            return (
              <ScrollView
                key={index}
                style={[styles.carouselItemScroll, styles.summaryWrapper]}
              >
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
                      <Pressable
                        style={styles.summaryContainer}
                        onPress={handlePressToUnlock}
                      >
                        <Text style={styles.summaryText} key="meaning">
                          {interpretation ?? ''}
                        </Text>
                        {!spread?.interpretation && <PressToUnlock />}
                      </Pressable>

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
            carouselWidth - dimensions.width < 32
              ? `${splittedTitle.slice(0, middleIndex).join(' ')}\n${splittedTitle.slice(middleIndex).join(' ')}`
              : t(card.name);
          const navArrowSize = carouselWidth < 620 ? 48 : 70;
          const readingCardWidth = Math.max(
            140,
            Math.min(300, carouselWidth - navArrowSize * 2 - 56)
          );
          const isDaySuggest = spread?.id === SpreadName.Simple_DaySuggest;
          const dayCardWidth = Math.max(
            168,
            Math.min(272, Math.round(carouselWidth * (carouselWidth < 900 ? 0.5 : 0.34))),
          );
          const dayCardHeight = Math.round((dayCardWidth / 9) * 16);
          const cardWidth = isDaySuggest ? dayCardWidth : readingCardWidth;
          const cardHeight = Math.round((cardWidth / 9) * 16);

          return (
            <ScrollView
              key={index}
              style={styles.carouselItemScroll}
              contentContainerStyle={
                isDaySuggest
                  ? [
                      styles.daySuggestScrollInner,
                      isPhone && styles.daySuggestScrollInnerPhone,
                    ]
                  : undefined
              }
            >
              <SafeAreaView style={[styles.content, isDaySuggest && styles.daySuggestContent]}>
                <View style={[styles.contentInner, isDaySuggest && styles.daySuggestContentInner]}>
                  <View
                    style={[
                      styles.paddingWrapper,
                      isDaySuggest && styles.paddingWrapperDaySuggest,
                    ]}
                  >
                    {!!spread?.cardsOrder?.length && (
                      <Text category={TEXT_TAGS.h3} style={styles.orderMeaning}>
                        {t(
                          `spread:${spread?.cardsOrder?.[index - (hasSummary ? 1 : 0)]?.meaning ?? ''}`
                        )}
                      </Text>
                    )}

                    <SafeAreaView
                      style={[
                        styles.navigationContainer,
                        isDaySuggest && styles.navigationContainerDaySuggest,
                      ]}
                    >
                      {!isDaySuggest && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('core:button.prev')}
                          disabled={isFirstCard}
                          onPress={viewPrevCard}
                          style={[
                            styles.navArrowButton,
                            isFirstCard && styles.navArrowButtonDisabled,
                          ]}
                        >
                          <ChevronLeftIcon
                            width={navArrowSize}
                            height={navArrowSize}
                            style={styles.chevron}
                            strokeOpacity={isFirstCard ? 0 : 1}
                          />
                        </Pressable>
                      )}
                      <View
                        style={[
                          styles.cardFrame,
                          isDaySuggest && styles.cardFrameDaySuggest,
                          { width: cardWidth, height: cardHeight },
                        ]}
                      >
                        <TarotCard
                          cardId={card?.id}
                          direction={card.direction}
                          width={cardWidth}
                          height={cardHeight}
                          styleCard={[
                            styles.readingCard,
                            isDaySuggest && styles.readingCardDaySuggest,
                            { width: cardWidth, height: cardHeight },
                          ]}
                        />
                      </View>
                      {!isDaySuggest && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('core:button.next')}
                          disabled={isLastCard}
                          onPress={viewNextCard}
                          style={[
                            styles.navArrowButton,
                            isLastCard && styles.navArrowButtonDisabled,
                          ]}
                        >
                          <ChevronLeftIcon
                            width={navArrowSize}
                            height={navArrowSize}
                            style={styles.rightChevron}
                            strokeOpacity={isLastCard ? 0 : 1}
                          />
                        </Pressable>
                      )}
                    </SafeAreaView>
                    {spread?.id === SpreadName.Simple_YesNo && (
                      <Text category={TEXT_TAGS.h2} style={styles.title}>
                        {t(card.yesNo)}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.namesContainer,
                        isDaySuggest && styles.namesContainerDaySuggest,
                      ]}
                    >
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

                    {isLastCard && spread?.id !== SpreadName.Simple_DaySuggest && (
                      <View style={styles.lastActions}>
                        <Button style={[styles.actionButton, styles.doneButton]} onPress={handleDone}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    overflow: 'visible',
    alignSelf: 'stretch',
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  carouselA11yHost: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  carousel: {
    zIndex: 2,
    ...Platform.select({
      web: { overflow: 'visible' as const },
      default: {},
    }),
  },
  paddingWrapper: {
    paddingHorizontal: 16,
    gap: 20,
  },
  paddingWrapperDaySuggest: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  content: {
    gap: 20,
    paddingBottom: 32,
    marginBottom: 32,
  },
  daySuggestScrollInner: {
    paddingBottom: 24,
  },
  daySuggestScrollInnerPhone: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  daySuggestContent: {
    marginBottom: 0,
    paddingBottom: 12,
  },
  daySuggestContentInner: {
    marginBottom: 0,
    gap: 16,
  },
  carouselItemScroll: {
    width: '100%',
    height: '100%',
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
  namesContainerDaySuggest: {
    marginTop: 10,
    marginBottom: 10,
  },
  contentInner: {
    gap: 20,
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'space-between',
  },
  doneButton: {
    backgroundColor: 'rgba(88, 101, 242, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(182, 190, 255, 0.72)',
  },
  lastActions: {
    gap: 12,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  actionButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    ...({
      cursor: 'pointer',
      boxShadow: '0 10px 22px rgba(0,0,0,0.30)',
      transitionDuration: '140ms',
    } as object),
  },
  orderMeaning: {
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    overflow: 'hidden',
  },
  navigationContainerDaySuggest: {
    gap: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  cardFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFrameDaySuggest: {
    alignSelf: 'center',
  },
  readingCard: {
    maxWidth: '100%',
    flexShrink: 1,
  },
  readingCardDaySuggest: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    ...({
      boxShadow: '0 18px 34px rgba(0,0,0,0.42)',
    } as object),
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
    flexShrink: 0,
  },
  navArrowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  navArrowButtonDisabled: {
    opacity: 0.6,
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
