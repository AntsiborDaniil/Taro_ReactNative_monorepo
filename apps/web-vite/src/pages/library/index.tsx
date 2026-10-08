import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { BookIcon, Header, ListRow, SettingsIcon } from '@shared/ui';
import { getImage } from '@shared/lib/getImage';
import { LEGAL_ENTITY } from '@legacy-legal';
import { LibraryCard } from './ui/LibraryCard';
import styles from './Library.module.css';

type Plate = { id: string; titleKey: string; subtitleKey: string; img: string; to: string };

const PLATES: Plate[] = [
  {
    id: 'dictionary',
    titleKey: 'core:library.tile.dictionary.title',
    subtitleKey: 'core:library.tile.dictionary.subtitle',
    img: getImage(['core', 'cardsDescriptions']),
    to: '/dictionary',
  },
  {
    id: 'history',
    titleKey: 'core:library.tile.history.title',
    subtitleKey: 'core:library.tile.history.subtitle',
    img: getImage(['core', 'history']),
    to: '/history',
  },
  {
    id: 'mirror',
    titleKey: 'main:mirror.title',
    subtitleKey: 'main:mirror.link.subtitle',
    img: getImage(['core', 'mirror']),
    to: '/mirror',
  },
  {
    id: 'favorite',
    titleKey: 'core:library.tile.favorite.title',
    subtitleKey: 'core:library.tile.favorite.subtitle',
    img: getImage(['core', 'favoriteCards']),
    to: '/favorites',
  },
];

/**
 * Перенос apps/web/src/pages/library/ui/Library.tsx: интро-текст, сетка
 * плашек-категорий (CSS grid вместо JS-расчёта колонок), строка «Настройки»
 * и подвал с ссылкой на документы.
 */
export default function LibraryPage(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header root title={t('core:library')} />
        <p className={styles.intro}>{t('core:library.intro.lead')}</p>
        <div className={styles.grid}>
          {PLATES.map((plate) => (
            <LibraryCard key={plate.id} title={t(plate.titleKey)} subtitle={t(plate.subtitleKey)} img={plate.img} to={plate.to} />
          ))}
        </div>
        <ListRow
          leadingIcon={<SettingsIcon width={22} height={22} />}
          title={t('settings:settings')}
          subtitle={t('core:library.settings.subtitle')}
          to="/settings"
        />
        <div className={styles.footer}>
          <ListRow
            leadingIcon={<BookIcon width={22} height={22} />}
            title={t('settings:legal.title')}
            to="/documents"
          />
          <p className={styles.copy}>{`© ${new Date().getFullYear()} ${LEGAL_ENTITY.brand} · ${t('settings:legal.badge.age')}`}</p>
        </div>
      </div>
    </div>
  );
}
