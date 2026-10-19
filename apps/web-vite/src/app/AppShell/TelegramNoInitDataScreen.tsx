import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@shared/lib/store';
import { readTelegramInitData } from '@shared/api/telegramReauth';
import { Button, StatusScreen } from '@shared/ui';
import styles from './TelegramNoInitDataScreen.module.css';

/** Мост Telegram грузится defer-скриптом — даём время, прежде чем решить, что initData нет. */
const INIT_DATA_GRACE_MS = 2500;

/**
 * Mini App открыт внутри Telegram, но без initData — войти тихо нечем.
 * Так бывает при запуске с reply-кнопки бота (KeyboardButton web_app): Telegram
 * не передаёт туда данные пользователя. Кнопка шлёт sendData — бот в ответ присылает
 * inline-кнопку, которая открывает Mini App уже с initData (apps/bot: web_app_data).
 * sendData сам закрывает Mini App; если клиент его не поддерживает — подсказка и «Закрыть».
 */
export function TelegramNoInitDataScreen(): ReactElement | null {
  const { t } = useTranslation('core');
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const [missing, setMissing] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tg = window.Telegram?.WebApp;
      // platform 'unknown' — обычный браузер (скрипт моста подключён всегда).
      const insideTelegram = Boolean(tg && tg.platform && tg.platform !== 'unknown');
      setMissing(insideTelegram && !readTelegramInitData());
    }, INIT_DATA_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!missing || isAuthenticated) return null;

  const reopen = () => {
    const tg = window.Telegram?.WebApp;
    try {
      tg?.sendData?.('relaunch');
    } catch {
      /* не keyboard-запуск — остаётся подсказка */
    }
    setSent(true);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <StatusScreen
        title={t('telegramRelaunch.title')}
        description={t(sent ? 'telegramRelaunch.hint' : 'telegramRelaunch.text')}
        action={
          sent ? (
            <Button variant="quiet" onClick={() => window.Telegram?.WebApp?.close?.()}>
              {t('telegramRelaunch.close')}
            </Button>
          ) : (
            <Button onClick={reopen}>{t('telegramRelaunch.cta')}</Button>
          )
        }
      />
    </div>
  );
}
