import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getImage } from '@shared/lib/getImage';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { ChevronRightIcon, SmartImage } from '@shared/ui';
import styles from './MainQuickLinks.module.css';

type QuickLink = {
  id: string;
  labelKey: string;
  subtitleKey: string;
  to: string;
  img: string;
};

const LINKS: QuickLink[] = [
  {
    id: 'mirror',
    labelKey: 'main:mirror.title',
    subtitleKey: 'main:mirror.link.subtitle',
    to: '/mirror',
    img: getImage(['core', 'mirrorBackgroundClear']),
  },
  {
    id: 'favorite',
    labelKey: 'core:library.tile.favorite.title',
    subtitleKey: 'core:library.tile.favorite.subtitle',
    to: '/favorites',
    img: getImage(['core', 'favoriteCardsBackgroundClear']),
  },
  {
    id: 'dictionary',
    labelKey: 'core:library.tile.dictionary.title',
    subtitleKey: 'core:library.tile.dictionary.subtitle',
    to: '/dictionary',
    img: getImage(['core', 'cardsDescriptionsBackgroundClear']),
  },
];

/**
 * Перенос apps/web/src/pages/main/ui/MainQuickLinks — Избранное → /favorites,
 * Значения карт → /dictionary (логика 1-в-1, навигация — react-router вместо
 * tab-навигатора).
 */
export function MainQuickLinks(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.list} aria-label={t('main:quickLinks.a11yHint') || undefined}>
      {LINKS.map((link) => (
        <button
          key={link.id}
          type="button"
          className={styles.row}
          aria-label={t(link.labelKey)}
          onClick={() => {
            track(AnalyticAction.ClickCategoryMainPage, { category: link.id });
            navigate(link.to);
          }}
        >
          <span className={styles.thumbFrame}>
            <SmartImage className={styles.thumbImage} src={link.img} />
          </span>
          <span className={styles.textCol}>
            <span className={styles.name}>{t(link.labelKey)}</span>
            <span className={styles.subtitle}>{t(link.subtitleKey)}</span>
          </span>
          <ChevronRightIcon width={18} height={18} className={styles.chevron} />
        </button>
      ))}
    </div>
  );
}
