import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FavoritesContext } from 'entities/favorites';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { tarotCards } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { CardsList, CardsPageSkeleton, NoContent, ScreenLayout } from 'shared/ui';

function FavoriteCards() {
  const { t } = useTranslation();

  const { favoritesCardsIds, isLoading } = useData({ Context: FavoritesContext });

  const cards = useMemo(() => {
    return Object.values(tarotCards).filter(
      (item) => favoritesCardsIds?.[item.id]
    );
  }, [favoritesCardsIds]);

  if (isLoading) {
    return <CardsPageSkeleton />;
  }

  return (
    <ScreenLayout>
      <Header showBackButton title={t('core:page.favouriteCards')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
});

export default FavoriteCards;
