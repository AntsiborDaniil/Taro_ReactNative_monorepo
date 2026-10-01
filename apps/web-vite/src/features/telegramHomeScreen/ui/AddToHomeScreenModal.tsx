import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text, useToast } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import {
  onTelegramHomeScreenAdded,
  requestTelegramAddToHomeScreen,
} from '@shared/lib/web/telegramWebApp';
import { readHomeScreenPromptState, writeHomeScreenPromptState } from '../lib/promptStorage';
import styles from './AddToHomeScreenModal.module.css';

/**
 * Предложение добавить Mini App на домашний экран телефона (Telegram Bot API 8+).
 * Показывается после первой интерпретации; «Не сейчас» / закрытие листа больше не спрашивает.
 */
export function AddToHomeScreenModal({ onClose }: ModalComponentProps): ReactElement {
  const { t } = useTranslation('settings');
  const toast = useToast();
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    return onTelegramHomeScreenAdded(() => {
      writeHomeScreenPromptState('added');
      toast.success(t('homeScreen.added'));
      onClose();
    });
  }, [onClose, t, toast]);

  // Закрытие свайпом / крестиком без кнопки = отказ от авто-промпта (строка в настройках остаётся).
  useEffect(() => {
    return () => {
      if (readHomeScreenPromptState() === null) {
        writeHomeScreenPromptState('dismissed');
      }
    };
  }, []);

  const handleAdd = () => {
    setRequested(true);
    const ok = requestTelegramAddToHomeScreen();
    if (!ok) {
      writeHomeScreenPromptState('unsupported');
      toast.info(t('homeScreen.unsupported'));
      onClose();
    }
  };

  const handleDismiss = () => {
    writeHomeScreenPromptState('dismissed');
    onClose();
  };

  return (
    <div className={styles.inner}>
      <Text role="body" tone="ink50" className={styles.body}>
        {t('homeScreen.body')}
      </Text>
      <div className={styles.actions}>
        <Button variant="action" onClick={handleAdd} disabled={requested}>
          {t('homeScreen.add')}
        </Button>
        <Button variant="quiet" quietTone="neutral" onClick={handleDismiss}>
          {t('homeScreen.later')}
        </Button>
      </div>
    </div>
  );
}
