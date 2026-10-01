import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, HeartIcon, Text } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import styles from './FavoriteLikeErrorModal.module.css';

/**
 * Перенос apps/web/src/entities/favorites/ui/FavoriteLikeErrorModal —
 * показывается когда облачный POST /api/favorites падает у авторизованного
 * пользователя (useFavorites.toggleFavorite, action === 'add').
 */
export function FavoriteLikeErrorModal({ onClose }: ModalComponentProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <div className={styles.iconWrap}>
        <HeartIcon width={40} height={40} />
      </div>
      <Text role="title" as="h2" className={styles.title}>
        {t('core:card.favoriteError.title')}
      </Text>
      <Text role="body" tone="ink100" className={styles.body}>
        {t('core:card.favoriteError.body')}
      </Text>
      <Button variant="action" fullWidth onClick={onClose}>
        {t('core:stub.emptyResultsModal.button', { defaultValue: 'Понятно' })}
      </Button>
    </div>
  );
}
