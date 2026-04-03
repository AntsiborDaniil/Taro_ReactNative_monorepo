import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FavoritesContext } from 'entities/favorites';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { tarotCards } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { CardsList, NoContent, ScreenLayout } from 'shared/ui';

function FavoriteCards() {
  const { t } = useTranslation();

  const { favoritesCardsIds } = useData({ Context: FavoritesContext });

  const cards = useMemo(() => {
    return Object.values(tarotCards).filter(
      (item) => favoritesCardsIds?.[item.id]
    );
  }, [favoritesCardsIds]);

  return (
    <ScreenLayout>
      <Header showBackButton title={t('core:page.favouriteCards')} />
      <ScrollView style={styles.wrapper}>
        {cards.length ? (
          <CardsList cards={cards} />
        ) : (
          <NoContent title={t('core:favoriteCards.noCards')} />
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 48,
  },
});

export default FavoriteCards;
