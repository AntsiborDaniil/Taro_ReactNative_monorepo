import { registerModal } from '@shared/ui/ModalSheet';
import { FavoriteLikeErrorModal } from './ui/FavoriteLikeErrorModal';

export * from './api';
export * from './model/local';
export * from './model/useFavorites';
export * from './ui/FavoriteButton';

// Побочный эффект: регистрирует модалку 'favorite-like-error' в реестре ModalSheet
// (открывается из useFavorites.toggleFavorite при ошибке облака на добавлении).
registerModal('favorite-like-error', { Component: FavoriteLikeErrorModal });
