import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import styles from './BuySpreadCreditsModal.module.css';

/**
 * Сеть/таймаут при толковании или follow-up — не «молча пропускаем», а явный лист.
 */
export function NetworkErrorModal({ onClose }: ModalComponentProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <Text role="title" as="h2">
        {t('core:ai.network.title')}
      </Text>
      <Text role="body" tone="ink100">
        {t('core:ai.network.body')}
      </Text>
      <Button variant="action" fullWidth onClick={onClose}>
        {t('core:ai.network.button')}
      </Button>
    </div>
  );
}
