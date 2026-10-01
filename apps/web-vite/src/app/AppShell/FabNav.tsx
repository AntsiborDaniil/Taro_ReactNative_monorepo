import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ALL_NAV_ITEMS } from './navItems';
import styles from './FabNav.module.css';

const SCROLL_HIDE_THRESHOLD = 12;
const NEAR_BOTTOM_PX = 24;

/** Прячется при скролле вниз, возвращается при скролле вверх и у конца страницы. */
function useScrollVisible(): boolean {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(typeof window === 'undefined' ? 0 : window.scrollY);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const nearBottom = y + window.innerHeight >= doc.scrollHeight - NEAR_BOTTOM_PX;
      const delta = y - lastY.current;

      if (nearBottom || y <= 0) {
        setVisible(true);
      } else if (delta > SCROLL_HIDE_THRESHOLD) {
        setVisible(false);
      } else if (delta < -SCROLL_HIDE_THRESHOLD) {
        setVisible(true);
      }

      lastY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return visible;
}

export function FabNav(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const visible = useScrollVisible();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeItem = ALL_NAV_ITEMS.find((item) => item.isActive(pathname)) ?? ALL_NAV_ITEMS[0];
  const ActiveIcon = activeItem.Icon;

  return (
    <div className={visible ? styles.root : `${styles.root} ${styles.rootHidden}`}>
      {open && (
        <ul className={styles.menu}>
          {ALL_NAV_ITEMS.map(({ to, labelKey, Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <li key={to}>
                <button
                  type="button"
                  className={active ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}
                  onClick={() => {
                    navigate(to);
                    setOpen(false);
                  }}
                >
                  <Icon className={styles.menuIcon} />
                  <span>{t(labelKey)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label={open ? t('nav.fab.close') : t('nav.fab.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <ActiveIcon className={styles.fabIcon} />
      </button>
    </div>
  );
}
