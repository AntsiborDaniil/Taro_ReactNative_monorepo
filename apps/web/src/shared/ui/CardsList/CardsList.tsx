import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMemo } from 'react';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { DeckStyle } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { NavigationRoute, TabRoute } from 'shared/types';
import { COLORS } from '../../themes';
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
};

const LOCKED_DECK_STYLES = ['settings:deck.style.modern'];
const GRID_GAP = 14;
const CARD_ASPECT_RATIO = 9 / 16;

function CardsList<T extends BaseTarotCardProps>({
  cards,
  isAllUnlocked,
  hasSelectStatus,
  onPressAnalytics,
  onPress,
  onPressLocked,
}: CardsListProps<T>) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const { sceneContentWidth } = useTabRailLayout();

  const { appearance, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const navigation = useNativeNavigation();
  const containerWidth = Math.max(260, Math.min(windowWidth, sceneContentWidth) - 32);
  const numColumns = useMemo(() => {
    if (containerWidth >= 1100) return 4;
    if (containerWidth >= 760) return 3;
    return 2;
  }, [containerWidth]);

  const cardWidth = useMemo(
    () => Math.floor((containerWidth - GRID_GAP * (numColumns - 1)) / numColumns),
    [containerWidth, numColumns]
  );
  const cardHeight = useMemo(
    () => Math.round(cardWidth / CARD_ASPECT_RATIO),
    [cardWidth]
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
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
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
    minHeight: 56,
    width: '100%',
    alignItems: 'center',
  },

  text: {
    textAlign: 'center',
  },
  row: {
    gap: GRID_GAP,
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
