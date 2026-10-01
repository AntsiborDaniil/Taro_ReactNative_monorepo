import { useEffect, useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@shared/ui';
import { MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM } from './navItems';
import styles from './NavRail.module.css';

const COLLAPSE_SESSION_KEY = 'taro_web_tab_rail_collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.sessionStorage.getItem(COLLAPSE_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Рейка ≥900px: развёрнута 228px (иконка + подпись), свёрнута 76px (только иконки). */
export function NavRail(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(COLLAPSE_SESSION_KEY, collapsed ? '1' : '0');
    } catch {
      // sessionStorage недоступен (приватный режим и т.п.) — не критично.
    }
  }, [collapsed]);

  return (
    <nav
      className={`${styles.rail} ${collapsed ? styles.collapsed : styles.expanded}`}
      aria-label={t('nav.landmark')}
    >
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? t('nav.rail.expand') : t('nav.rail.collapse')}
          aria-pressed={collapsed}
        >
          {collapsed ? <ChevronRightIcon width={18} height={18} /> : <ChevronLeftIcon width={18} height={18} />}
        </button>
      </div>
      <div className={styles.top}>
        {MAIN_NAV_ITEMS.map(({ to, labelKey, Icon, isActive }) => {
          const active = isActive(pathname);
          const label = t(labelKey);
          return (
            <button
              key={to}
              type="button"
              className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
              onClick={() => navigate(to)}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className={styles.icon} />
              {!collapsed ? <span className={styles.label}>{label}</span> : null}
            </button>
          );
        })}
      </div>
      <div className={styles.bottom}>
        {(() => {
          const active = SETTINGS_NAV_ITEM.isActive(pathname);
          const Icon = SETTINGS_NAV_ITEM.Icon;
          const label = t(SETTINGS_NAV_ITEM.labelKey);
          return (
            <button
              type="button"
              className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
              onClick={() => navigate(SETTINGS_NAV_ITEM.to)}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className={styles.icon} />
              {!collapsed ? <span className={styles.label}>{label}</span> : null}
            </button>
          );
        })()}
      </div>
    </nav>
  );
}
