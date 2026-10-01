import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tarotCards } from '@legacy-data';
import { TarotCardFace } from '@entities/spread';
import { FavoriteButton, useFavorites } from '@entities/favorites';
import { ensureI18nNamespaces } from '@shared/i18n';
import { EmptyState, Header, Skeleton, Text } from '@shared/ui';
import styles from './Favorites.module.css';

/**
 * Перенос apps/web/src/pages/favoriteCards/ui/FavoriteCards.tsx — сетка
 * оправ карт (CSS grid, auto-fill, как каталог раскладов), клик → /card/:id.
 * Гость — localStorage ('favoriteCards'), авторизован — /api/favorites
 * (entities/favorites/model/useFavorites).
 */
export default function FavoritesPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favoriteIds, isLoading } = useFavorites();

  const [cardNsReady, setCardNsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const cardIds = Object.keys(favoriteIds).filter((id) => Boolean(tarotCards[id]));

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('core:page.favorite', { defaultValue: 'Избранные карты' })} />

        {isLoading || !cardNsReady ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} width="100%" height="auto" radius={12} style={{ aspectRatio: '9 / 16' }} />
            ))}
          </div>
        ) : cardIds.length === 0 ? (
          <EmptyState
            title={t('core:favoriteCards.noCards', { defaultValue: 'Вы ещё не добавили карты в избранное' })}
          />
        ) : (
          <div className={styles.grid}>
            {cardIds.map((cardId) => {
              const card = tarotCards[cardId];
              const name = t(card.name);
              return (
                <div key={cardId} className={styles.tile}>
                  <button type="button" className={styles.tileLink} onClick={() => navigate(`/card/${cardId}`)}>
                    <TarotCardFace cardId={cardId} />
                  </button>
                  <FavoriteButton cardId={cardId} cardName={name} className={styles.tileLike} size={20} />
                  <Text role="micro" className={styles.name}>
                    {name}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
