import { useEffect, useState, type ReactElement, type TransitionEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ALL_NAV_ITEMS } from './navItems';
import styles from './FabNav.module.css';

/**
 * Мобильная навигация: FAB всегда на экране.
 * present — меню в DOM; entered — класс открытия (после paint, иначе нет enter-анимации).
 */
export function FabNav(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    setEntered(false);
  }, [open]);

  // Без transition (reduced-motion) onTransitionEnd не придёт — снимаем меню сразу.
  useEffect(() => {
    if (open || !present) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPresent(false);
  }, [open, present]);

  useEffect(() => {
    if (!present || !open) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [present, open]);

  const handleMenuTransitionEnd = (event: TransitionEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'opacity') return;
    if (!open) setPresent(false);
  };

  const activeItem = ALL_NAV_ITEMS.find((item) => item.isActive(pathname)) ?? ALL_NAV_ITEMS[0];
  const ActiveIcon = activeItem.Icon;

  return (
    <div className={styles.root}>
      {present ? (
        <ul
          className={entered ? `${styles.menu} ${styles.menuOpen}` : styles.menu}
          onTransitionEnd={handleMenuTransitionEnd}
          aria-hidden={!open}
        >
          {ALL_NAV_ITEMS.map(({ to, labelKey, Icon, isActive }, index) => {
            const active = isActive(pathname);
            return (
              <li
                key={to}
                className={styles.menuItemWrap}
                style={{ ['--fab-item-index' as string]: index }}
              >
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
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
      ) : null}
      <button
        type="button"
        className={open ? `${styles.fab} ${styles.fabOpen}` : styles.fab}
        aria-expanded={open}
        aria-label={open ? t('nav.fab.close') : t('nav.fab.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <ActiveIcon className={styles.fabIcon} />
      </button>
    </div>
  );
}
