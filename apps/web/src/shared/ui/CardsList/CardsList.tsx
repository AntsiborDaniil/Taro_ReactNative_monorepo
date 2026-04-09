import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { NavigationRoute, TabRoute } from 'shared/types';
import { TarotCard, Text, TEXT_TAGS } from 'shared/ui';
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

const { width } = Dimensions.get('window');

const cardWidth = (width - 4 * 20) / 3;

const LOCKED_DECK_STYLES = ['settings:deck.style.modern'];

function CardsList<T extends BaseTarotCardProps>({
  cards,
  isAllUnlocked,
  hasSelectStatus,
  onPressAnalytics,
  onPress,
  onPressLocked,
}: CardsListProps<T>) {
  const { t } = useTranslation();

  const { appearance, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const navigation = useNativeNavigation();

  return (
    <SafeAreaView style={styles.wrapper}>
      <FlatList
        data={cards}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
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
                styleCard={styles.card}
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
    width: cardWidth,
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
    justifyContent: 'space-between',
  },
});

export default CardsList;
