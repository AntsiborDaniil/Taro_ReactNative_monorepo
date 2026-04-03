import { StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { TSelectedTarotCard, TTarotCard } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { HeartIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { FavoritesContext } from '../../model';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';

export type LikeCardProps = {
  card: TTarotCard | TSelectedTarotCard;
  onAdditionalPress?: () => Promise<void>;
};

function LikeCard({ card, onAdditionalPress }: LikeCardProps) {
  const { addOrRemoveFavoriteCard, favoritesCardsIds } = useData({
    Context: FavoritesContext,
  });

  const navigation = useNativeNavigation();

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <HeartIcon
        width={40}
        height={40}
        stroke={favoritesCardsIds?.[card.id] ? COLORS.Love : COLORS.SpbSky1}
        strokeWidth={favoritesCardsIds?.[card.id] ? 1 : 1.8}
        fill={favoritesCardsIds?.[card.id] ? COLORS.Love : COLORS.Background}
        onPress={async () => {
          await onAdditionalPress?.();

          addOrRemoveFavoriteCard?.(card);

          if (!favoritesCardsIds?.[card.id]) {
            Toast.show({
              type: 'success',
              text1: t('core:card.added1'),
              text2: t('core:card.added2'),
              onPress: () =>
                navigation.navigate(selectedTab as TabRoute, {
                  screen: NavigationRoute.FavoriteCards,
                }),
            });
          }

          AppMetrica.reportEvent(AnalyticAction.ClickLikeTarotCard, {
            [card.name]: !favoritesCardsIds?.[card.id],
            like: !favoritesCardsIds?.[card.id],
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    // width: '80%',
  },
});

export default LikeCard;
