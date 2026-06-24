import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { TAB_BREAKPOINT_RAIL } from 'app/navigation/tabs/adaptiveTabLayout';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { DeckStyle } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { useWebScrollFriendlyPress } from 'shared/lib/web/useWebScrollFriendlyPress';
import { webCardTileProps } from 'shared/lib/web/webScrollClasses';
import { NavigationRoute, TabRoute } from 'shared/types';
import { COLORS } from '../../themes';
import { EmptyResultsModal } from '../EmptyResultsModal';
import { ModalsContext } from '../ModalsProvider';
import { Text, TEXT_TAGS } from '../Text';
import TarotCard from '../TarotCard/TarotCard';

type BaseTarotCardProps = {
  id: string;
  name: string;
  customAppearance?: DeckStyle;
};

type CardsListProps<T> = {
  cards: T[];
  isAllUnlocked?: boolean;
  hasSelectStatus?: boolean;
  onPressAnalytics?: (card: T) => void;
  onPress?: (card: T) => void;
  onPressLocked?: () => void;
  /** Плотная сетка (напр. словарь карт): крупные карты, фиксированные брейкпоинты по ширине. */
  preferCompactTiles?: boolean;
  /** Одна колонка на узком экране (напр. избранные карты). */
  mobileSingleColumn?: boolean;
};

type CardGridItemProps<T extends BaseTarotCardProps> = {
  item: T;
  cardWidth: number;
  cardHeight: number;
  isLocked: boolean;
  hasSelectStatus?: boolean;
  isSelected: boolean;
  customAppearance?: DeckStyle;
  useWebScrollTap: boolean;
  useScrollFriendlyTap: boolean;
  onOpen: () => void;
  label: string;
};

const LOCKED_DECK_STYLES = ['settings:deck.style.modern'];
const GRID_GAP = 14;
const GRID_SIDE_PADDING = 24;
import { CARDS_GRID_SIDE_PADDING_COMPACT } from './gridPadding';

const GRID_SIDE_PADDING_COMPACT = CARDS_GRID_SIDE_PADDING_COMPACT;
const GRID_GAP_DICTIONARY = 16;
const CARD_ASPECT_RATIO = 9 / 16;
const DICTIONARY_CARD_WIDTH_MIN_DESKTOP = 152;
const DICTIONARY_CARD_WIDTH_MAX = 234;
const MOBILE_TILE_PRESS_DELAY_MS = 220;

function CardGridItem<T extends BaseTarotCardProps>({
  item,
  cardWidth,
  cardHeight,
  isLocked,
  hasSelectStatus,
  isSelected,
  customAppearance,
  useWebScrollTap,
  useScrollFriendlyTap,
  onOpen,
  label,
}: CardGridItemProps<T>) {
  const webPress = useWebScrollFriendlyPress(onOpen);

  const tileStyle = [
    styles.item,
    { width: cardWidth },
    useWebScrollTap && styles.itemMobileSingle,
  ];

  const cardNode = (
    <>
      <TarotCard
        pointerEvents={useWebScrollTap ? 'none' : 'auto'}
        styleCard={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
          },
        ]}
        width={cardWidth}
        height={cardHeight}
        isLocked={isLocked}
        isSelected={hasSelectStatus && isSelected}
        customAppearance={customAppearance}
        cardId={item.id}
      />
      <View
        pointerEvents={useWebScrollTap ? 'none' : 'auto'}
        style={styles.textWrapper}
      >
        <Text numberOfLines={2} category={TEXT_TAGS.h5} style={styles.text}>
          {label}
        </Text>
      </View>
    </>
  );

  if (useWebScrollTap && webPress) {
    return (
      <View
        {...webCardTileProps()}
        {...webPress}
        style={tileStyle}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {cardNode}
      </View>
    );
  }

  return (
    <Pressable
      delayPressIn={
        useScrollFriendlyTap ? MOBILE_TILE_PRESS_DELAY_MS : undefined
      }
      onPress={onOpen}
      style={({ pressed }) => [
        ...tileStyle,
        pressed && styles.itemPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {cardNode}
    </Pressable>
  );
}

function CardsList<T extends BaseTarotCardProps>({
  cards,
  isAllUnlocked,
  hasSelectStatus,
  onPressAnalytics,
  onPress,
  onPressLocked,
  preferCompactTiles,
  mobileSingleColumn,
}: CardsListProps<T>) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const { sceneContentWidth } = useTabRailLayout();

  const { appearance, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { showModal } = useData({ Context: ModalsContext });
  const emptyModalShownRef = useRef(false);

  const navigation = useNativeNavigation();

  useEffect(() => {
    if (cards.length > 0) {
      emptyModalShownRef.current = false;

      return;
    }

    if (emptyModalShownRef.current || !showModal) {
      return;
    }

    emptyModalShownRef.current = true;
    showModal(<EmptyResultsModal />);
  }, [cards.length, showModal]);

  const sidePad = preferCompactTiles ? GRID_SIDE_PADDING_COMPACT : GRID_SIDE_PADDING;
  const containerWidth = Math.max(
    200,
    Math.min(windowWidth, sceneContentWidth) - sidePad
  );
  const gridGap = preferCompactTiles ? GRID_GAP_DICTIONARY : GRID_GAP;

  const isMobileDictionaryGrid =
    preferCompactTiles && containerWidth < TAB_BREAKPOINT_RAIL;

  const isMobileSingleColumnGrid =
    mobileSingleColumn && containerWidth < TAB_BREAKPOINT_RAIL;

  const isMobileStackLayout =
    isMobileDictionaryGrid || isMobileSingleColumnGrid;

  const numColumns = useMemo(() => {
    if (isMobileSingleColumnGrid) {
      return 1;
    }

    if (preferCompactTiles) {
      if (containerWidth >= 1480) return 6;
      if (containerWidth >= 1180) return 5;
      if (containerWidth >= 920) return 4;
      if (containerWidth >= TAB_BREAKPOINT_RAIL) return 3;
      // Мобилка: одна колонка — проще скроллить, меньше перехвата жеста.
      return 1;
    }

    if (containerWidth >= 1100) return 4;
    if (containerWidth >= 760) return 3;
    return 2;
  }, [containerWidth, preferCompactTiles, isMobileSingleColumnGrid]);

  const cardWidth = useMemo(() => {
    const raw = Math.floor(
      (containerWidth - gridGap * Math.max(0, numColumns - 1)) / numColumns
    );
    if (isMobileSingleColumnGrid) {
      return Math.min(280, Math.max(160, raw));
    }

    if (preferCompactTiles) {
      if (isMobileDictionaryGrid) {
        return Math.min(
          DICTIONARY_CARD_WIDTH_MAX,
          Math.max(DICTIONARY_CARD_WIDTH_MIN_DESKTOP, raw)
        );
      }

      return Math.max(
        DICTIONARY_CARD_WIDTH_MIN_DESKTOP,
        Math.min(DICTIONARY_CARD_WIDTH_MAX, raw)
      );
    }

    return Math.max(130, raw);
  }, [
    containerWidth,
    numColumns,
    preferCompactTiles,
    gridGap,
    isMobileDictionaryGrid,
    isMobileSingleColumnGrid,
  ]);

  const cardHeight = useMemo(
    () => Math.round(cardWidth / CARD_ASPECT_RATIO),
    [cardWidth]
  );

  const columnWrapperStyle = useMemo(
    () =>
      numColumns > 1 ? [styles.row, { gap: gridGap }] : undefined,
    [numColumns, gridGap]
  );

  const openCard = useCallback(
    async (item: T) => {
      await handleVibrationClick?.();

      const isLocked = isAllUnlocked
        ? false
        : LOCKED_DECK_STYLES.includes(item.name);

      if (isLocked) {
        onPressLocked?.();
        return;
      }

      if (onPress) {
        onPress(item);
        return;
      }

      onPressAnalytics?.(item);

      navigation.navigate(selectedTab as TabRoute, {
        screen: NavigationRoute.SpreadDetailCard,
        params: {
          id: item.id,
        },
      });
    },
    [
      handleVibrationClick,
      isAllUnlocked,
      navigation,
      onPress,
      onPressAnalytics,
      onPressLocked,
      selectedTab,
    ]
  );

  const useWebScrollTap = isMobileStackLayout && Platform.OS === 'web';

  const listEmpty =
    cards.length === 0 ? (
      <View style={styles.emptyResults}>
        <Text category={TEXT_TAGS.p1} style={styles.emptyResultsText}>
          {t('core:stub.emptyResults')}
        </Text>
      </View>
    ) : null;

  const renderCard = (item: T) => {
    const isLocked = isAllUnlocked
      ? false
      : LOCKED_DECK_STYLES.includes(item.name);

    return (
      <CardGridItem
        key={item.id}
        item={item}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        isLocked={isLocked}
        hasSelectStatus={hasSelectStatus}
        isSelected={appearance?.deckStyle === item.customAppearance}
        customAppearance={item.customAppearance}
        useWebScrollTap={useWebScrollTap}
        useScrollFriendlyTap={isMobileStackLayout}
        onOpen={() => {
          void openCard(item);
        }}
        label={t(item.name)}
      />
    );
  };

  // FlatList внутри ScrollView на web/mobile перехватывает touch — на мобилке plain map.
  if (isMobileStackLayout) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.listContent}>
          {cards.length === 0 ? listEmpty : cards.map(renderCard)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <FlatList
        key={`cards-grid-${numColumns}`}
        data={cards}
        numColumns={numColumns}
        scrollEnabled={false}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={listEmpty}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderCard(item)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
  },
  wrapper: {
    marginBottom: 32,
  },
  listContent: {
    gap: 16,
    alignItems: 'center',
  },
  item: {
    gap: 10,
    alignItems: 'center',
  },
  itemMobileSingle: {
    alignSelf: 'center',
  },
  itemPressed: {
    opacity: 0.72,
  },
  textWrapper: {
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  emptyResults: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsText: {
    textAlign: 'center',
    color: COLORS.Content,
    opacity: 0.82,
  },
});

export default CardsList;
