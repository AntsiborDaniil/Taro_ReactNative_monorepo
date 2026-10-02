import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@entities/settings';
import { BellIcon, Header, ListRow, Switch, Text } from '@shared/ui';
import styles from './Sound.module.css';

/**
 * Перенос apps/web/src/pages/settings/ui/Sound/Sound.tsx (web-ветка): на web
 * реально активна только вибрация (SOUND_SETTINGS_FIELDS в старом коде
 * оставляет notifications/moonNotifications закомментированными — push на
 * web не реализован). handleVibrationClick — navigator.vibrate, см.
 * entities/settings/model/useSettings.ts.
 */
export default function SoundPage(): ReactElement {
  const { t } = useTranslation();
  const { settings, updateSetting, handleVibrationClick } = useSettings();

  const handleToggle = (checked: boolean) => {
    updateSetting('sound', { vibration: checked });
    if (checked) handleVibrationClick();
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('settings:sound.web')} />
        <Text role="micro" tone="ink100" className={styles.hint}>
          {t('settings:sound.web.hint')}
        </Text>
        <ListRow
          leadingIcon={<BellIcon width={22} height={22} />}
          title={t('settings:sound.vibration')}
          trailing={
            <Switch
              checked={settings.sound?.vibration ?? true}
              onChange={(event) => handleToggle(event.target.checked)}
              aria-label={t('settings:sound.vibration')}
            />
          }
        />
      </div>
    </div>
  );
}
