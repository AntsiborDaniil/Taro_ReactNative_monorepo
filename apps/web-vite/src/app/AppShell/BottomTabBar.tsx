import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ALL_NAV_ITEMS } from './navItems';
import styles from './BottomTabBar.module.css';

type IndicatorBox = {
  x: number;
  width: number;
  visible: boolean;
};

const HIDDEN: IndicatorBox = { x: 0, width: 0, visible: false };

type BottomTabBarProps = {
  /** Скрыть с анимацией (карусель выбора карт на /reading). */
  hidden?: boolean;
};

/**
 * Мобильная навигация <900px: плавающая стеклянная капсула как Telegram tapbar.
 * Активный пункт — pill-подложка, которая плавно скользит между вкладками.
 * На ≥900px скрыта, там NavRail.
 */
export function BottomTabBar({ hidden = false }: BottomTabBarProps): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const barRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<IndicatorBox>(HIDDEN);
  /** После первого измерения включаем transition — без «прыжка» с нуля. */
  const [animate, setAnimate] = useState(false);
  const measuredOnceRef = useRef(false);

  const activeIndex = ALL_NAV_ITEMS.findIndex((item) => item.isActive(pathname));

  useLayoutEffect(() => {
    const bar = barRef.current;

    const measure = () => {
      if (!bar || activeIndex < 0) {
        setIndicator(HIDDEN);
        return;
      }
      const item = itemRefs.current[activeIndex];
      if (!item) {
        setIndicator(HIDDEN);
        return;
      }
      const barRect = bar.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      setIndicator({
        x: itemRect.left - barRect.left,
        width: itemRect.width,
        visible: true,
      });
    };

    measure();
    if (measuredOnceRef.current) {
      setAnimate(true);
    } else {
      measuredOnceRef.current = true;
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (bar && ro) ro.observe(bar);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeIndex, pathname]);

  const indicatorStyle: CSSProperties | undefined = indicator.visible
    ? {
        transform: `translate3d(${indicator.x}px, 0, 0)`,
        width: indicator.width,
      }
    : undefined;

  return (
    <nav
      ref={barRef}
      className={hidden ? `${styles.bar} ${styles.barHidden}` : styles.bar}
      aria-label={t('nav.landmark')}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <span
        className={
          animate
            ? `${styles.indicator} ${styles.indicatorAnimate}`
            : styles.indicator
        }
        style={indicatorStyle}
        aria-hidden
        data-visible={indicator.visible ? '1' : '0'}
      />
      {ALL_NAV_ITEMS.map(({ to, labelKey, Icon, isActive }, index) => {
        const active = isActive(pathname);
        const label = t(labelKey);
        return (
          <button
            key={to}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            tabIndex={hidden ? -1 : undefined}
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
