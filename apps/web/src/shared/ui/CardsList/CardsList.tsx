import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { DeckStyle } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
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
};

const LOCKED_DECK_STYLES = ['settings:deck.style.modern'];
const GRID_GAP = 14;
const GRID_SIDE_PADDING = 24;
const GRID_SIDE_PADDING_COMPACT = 10;
const GRID_GAP_DICTIONARY = 16;
const CARD_ASPECT_RATIO = 9 / 16;
/** Словарь карт: крупные плитки, меньше колонок, сетка по брейкпоинтам. */
const DICTIONARY_CARD_WIDTH_MIN = 152;
const DICTIONARY_CARD_WIDTH_MAX = 234;

function CardsList<T extends BaseTarotCardProps>({
  cards,
  isAllUnlocked,
  hasSelectStatus,
  onPressAnalytics,
  onPress,
  onPressLocked,
  preferCompactTiles,
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

  const numColumns = useMemo(() => {
    if (preferCompactTiles) {
      if (containerWidth >= 1480) return 6;
      if (containerWidth >= 1180) return 5;
      if (containerWidth >= 920) return 4;
      if (containerWidth >= 640) return 3;
      if (containerWidth >= 400) return 2;
      return 1;
    }

    if (containerWidth >= 1100) return 4;
    if (containerWidth >= 760) return 3;
    if (containerWidth >= 430) return 2;
    return 1;
  }, [containerWidth, preferCompactTiles]);

  const cardWidth = useMemo(() => {
    const raw = Math.floor(
      (containerWidth - gridGap * Math.max(0, numColumns - 1)) / numColumns
    );
    if (preferCompactTiles) {
      return Math.max(
        DICTIONARY_CARD_WIDTH_MIN,
        Math.min(DICTIONARY_CARD_WIDTH_MAX, raw)
      );
    }

    return Math.max(160, raw);
  }, [containerWidth, numColumns, preferCompactTiles, gridGap]);
  const cardHeight = useMemo(
    () => Math.round(cardWidth / CARD_ASPECT_RATIO),
    [cardWidth]
  );
  const columnWrapperStyle = useMemo(
    () =>
      numColumns > 1 ? [styles.row, { gap: gridGap }] : undefined,
    [numColumns, gridGap]
  );
  const listEmpty =
    cards.length === 0 ? (
      <View style={styles.emptyResults}>
        <Text
          category={TEXT_TAGS.p1}
          style={styles.emptyResultsText}
        >
          {t('core:stub.emptyResults')}
        </Text>
      </View>
    ) : null;

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
        renderItem={({ item }) => {
          const isLocked = isAllUnlocked
            ? false
            : LOCKED_DECK_STYLES.includes(item.name);

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={async () => {
                await handleVibrationClick?.();

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
              }}
              style={styles.item}
            >
              <TarotCard
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
                isSelected={
                  hasSelectStatus &&
                  appearance?.deckStyle === item.customAppearance
                }
                customAppearance={item.customAppearance}
                cardId={item.id}
              />

              <View style={styles.textWrapper}>
                <Text
                  numberOfLines={2}
                  category={TEXT_TAGS.h5}
                  style={styles.text}
                >
                  {t(item.name)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
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
  },
  item: {
    gap: 10,
    alignItems: 'center',
    flex: 1,
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
