import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getBreakpoint, SHELL_MAX_WIDTH, SIDEBAR_WIDTH } from 'shared/lib';
import { NavigationRoute, TabRoute } from 'shared/types';
// Import directly to avoid the barrel-index require cycle:
// shared/ui/index.ts → CardsList → shared/ui/index.ts
import { TarotCard } from '../TarotCard';
import { Text, TEXT_TAGS } from '../Text';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';

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
const GAP = 12;
const H_PAD = 20;

function CardsList<T extends BaseTarotCardProps>({
  cards,
  isAllUnlocked,
  hasSelectStatus,
  onPressAnalytics,
  onPress,
  onPressLocked,
}: CardsListProps<T>) {
  const { t } = useTranslation();

  const { width: winWidth } = useWindowDimensions();
  const bp = getBreakpoint(winWidth);
  const sidebarW = bp === 'mobile' ? 0 : SIDEBAR_WIDTH[bp];
  const contentW = Math.min(winWidth, SHELL_MAX_WIDTH[bp]) - sidebarW - H_PAD * 2;
  // More columns on wider screens so cards stay a reasonable size
  const cols = contentW >= 1200 ? 7 : contentW >= 800 ? 5 : contentW >= 500 ? 4 : 3;
  const cardWidth = (contentW - GAP * (cols - 1)) / cols;

  const { appearance, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const navigation = useNativeNavigation();

  const cardHeight = cardWidth * (16 / 9);

  return (
    <SafeAreaView style={styles.wrapper}>
      <FlatList
        data={cards}
        numColumns={cols}
        key={`cols-${cols}`}
        scrollEnabled={false}
        columnWrapperStyle={[styles.row, { gap: GAP }]}
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
                  params: { id: item.id },
                });
              }}
              style={[styles.item, { width: cardWidth }]}
            >
              <TarotCard
                styleCard={styles.card}
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
  item: {
    gap: 4,
  },
  textWrapper: {
    height: 30,
  },
  text: {
    textAlign: 'center',
  },
  row: {
    marginTop: 16,
  },
});

export default CardsList;
