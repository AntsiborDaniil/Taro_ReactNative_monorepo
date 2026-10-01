import { useEffect, useState, type MouseEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartIcon, useToast } from '@shared/ui';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { useFavorites } from '../model/useFavorites';
import styles from './FavoriteButton.module.css';

export type FavoriteButtonProps = {
  cardId: string;
  cardName: string;
  className?: string;
  size?: number;
};

/**
 * Перенос apps/web/src/entities/favorites/ui/LikeCard — кнопка-сердце,
 * лайк/анлайк карты (гость — localStorage, авторизован — /api/favorites).
 * Тост при добавлении (core:card.added1/2), модалка 'favorite-like-error'
 * при ошибке облака — внутри useFavorites.
 * Цвет сердца меняется в клике, не дожидаясь ответа API.
 */
export function FavoriteButton({ cardId, cardName, className, size = 24 }: FavoriteButtonProps): ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const serverLiked = Boolean(favoriteIds[cardId]);
  const [pressed, setPressed] = useState<boolean | null>(null);
  const isLiked = pressed ?? serverLiked;

  useEffect(() => {
    if (pressed == null) return;
    if (pressed === serverLiked) setPressed(null);
  }, [pressed, serverLiked]);

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const nextLiked = !isLiked;
    setPressed(nextLiked);
    void toggleFavorite(cardId).then((result) => {
      if (result.ignored) {
        setPressed(null);
        return;
      }
      track(AnalyticAction.ClickLikeTarotCard, { card: cardName, like: nextLiked });
      if (!result.ok) {
        setPressed(null);
        return;
      }
      if (result.action === 'add') {
        toast.success(`${t('core:card.added1')} ${t('core:card.added2')}`);
      }
    });
  };

  return (
    <button
      type="button"
      className={[styles.button, isLiked ? styles.active : '', className].filter(Boolean).join(' ')}
      onClick={handleClick}
      aria-pressed={isLiked}
      aria-label={isLiked ? t('core:card.unlike', { defaultValue: 'Убрать из избранного' }) : t('core:card.like', { defaultValue: 'В избранное' })}
    >
      <HeartIcon width={size} height={size} className={styles.icon} />
    </button>
  );
}
