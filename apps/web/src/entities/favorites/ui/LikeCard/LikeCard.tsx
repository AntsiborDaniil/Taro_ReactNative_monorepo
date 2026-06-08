import { Pressable, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { TSelectedTarotCard, TTarotCard } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { HeartIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { FavoritesContext } from '../../model';
import { FavoriteLikeErrorModal } from '../FavoriteLikeErrorModal';

export type LikeCardProps = {
  card: TTarotCard | TSelectedTarotCard;
  onAdditionalPress?: () => Promise<void>;
};

function LikeCard({ card, onAdditionalPress }: LikeCardProps) {
  const { addOrRemoveFavoriteCard, favoritesCardsIds } = useData({
    Context: FavoritesContext,
  });

  const { showModal } = useData({ Context: ModalsContext });
  const navigation = useNativeNavigation();
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await onAdditionalPress?.();

          const wasLiked = !!favoritesCardsIds?.[card.id];
          const result = await addOrRemoveFavoriteCard?.(card);

          if (result?.ok && result.action === 'add') {
            Toast.show({
              type: 'success',
              text1: t('core:card.added1'),
              text2: t('core:card.added2'),
              onPress: () =>
                navigation.navigate(selectedTab as TabRoute, {
                  screen: NavigationRoute.FavoriteCards,
                }),
            });
          } else if (result && !result.ok && result.action === 'add') {
            showModal?.(<FavoriteLikeErrorModal />);
          }

          AppMetrica.reportEvent(AnalyticAction.ClickLikeTarotCard, {
            [card.name]: !wasLiked,
            like: !wasLiked,
          });
        }}
      >
        <HeartIcon
          width={40}
          height={40}
          stroke={favoritesCardsIds?.[card.id] ? COLORS.Love : COLORS.SpbSky1}
          strokeWidth={favoritesCardsIds?.[card.id] ? 1 : 1.8}
          fill={favoritesCardsIds?.[card.id] ? COLORS.Love : COLORS.Background}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
});

export default LikeCard;
