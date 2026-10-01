import type { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ALL_NAV_ITEMS } from './navItems';
import styles from './BottomTabBar.module.css';

/**
 * Мобильная навигация <900px: фиксированная нижняя панель как в Telegram
 * (иконка + короткая подпись). Раскрытие FAB больше нет — все пункты сразу на экране.
 * На ≥900px скрыта, там NavRail.
 */
export function BottomTabBar(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.bar} aria-label={t('nav.landmark')}>
      {ALL_NAV_ITEMS.map(({ to, labelKey, Icon, isActive }) => {
        const active = isActive(pathname);
        const label = t(labelKey);
        return (
          <button
            key={to}
            type="button"
            className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            onClick={() => navigate(to)}
          >
            <Icon className={styles.icon} />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
