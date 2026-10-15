import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { isAstroAnnounceVisible } from '@shared/lib/astroAnnounce';
import { ASTRO_ENABLED } from '@shared/lib/section';
import { ListRow, Text } from '@shared/ui';
import styles from './AstroAnnounce.module.css';

/** Одноразовая строка «Новое: твоё небо ›»: уходит навсегда после первого визита в /astro. */
export function AstroAnnounce(): ReactElement | null {
  const { t } = useTranslation();
  const [visible] = useState(isAstroAnnounceVisible);
  // Мир ещё в разработке: анонс не показываем (о нём говорит плашка «Скоро» в переключателе).
  if (!ASTRO_ENABLED || !visible) return null;
  return (
    <ListRow
      className={styles.row}
      leadingIcon={<span className={styles.glyph} aria-hidden="true">✦</span>}
      title={<Text role="label" as="span">{t('astro:home.announce')}</Text>}
      subtitle={t('astro:home.announce.hint')}
      to="/astro"
    />
  );
}
