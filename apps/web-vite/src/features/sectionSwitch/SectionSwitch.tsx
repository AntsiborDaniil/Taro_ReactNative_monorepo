import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { ASTRO_ENABLED, setLastSection, type AppSection } from '@shared/lib/section';
import styles from './SectionSwitch.module.css';

function CardsGlyph(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={styles.glyph}>
      <rect x="4" y="5" width="10" height="15" rx="2" transform="rotate(-10 9 12.5)" />
      <rect x="10" y="4" width="10" height="15" rx="2" transform="rotate(8 15 11.5)" />
    </svg>
  );
}

function MoonGlyph(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={styles.glyph}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
      <path d="M17 3.5v3M15.5 5h3" />
    </svg>
  );
}

/**
 * Сегмент «Таро | Астрология» в шапке Главной: подписанная кнопка перехода между мирами.
 * Бегунок едет 220 мс, небо (токены) меняется 700 мс — см. tokens.css, data-section.
 * Адрес меняется с replace: «назад» не прыгает между мирами.
 * Пока ASTRO_ENABLED = false, «Астрология» приглушена, с плашкой «Скоро» и никуда не ведёт.
 */
export function SectionSwitch({ current }: { current: AppSection }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const go = (section: AppSection) => {
    if (section === current) return;
    if (section === 'astro' && !ASTRO_ENABLED) {
      haptic.notify('warning');
      return;
    }
    haptic.selection();
    setLastSection(section);
    reachMetrikaGoal(MetrikaGoal.sectionSwitch, { section });
    navigate(section === 'astro' ? '/astro' : '/', { replace: true });
  };

  return (
    <div className={styles.root} role="tablist" aria-label={t('astro:switch.a11y')} data-current={current}>
      <span className={styles.thumb} aria-hidden="true" />
      <button
        type="button"
        role="tab"
        aria-selected={current === 'tarot'}
        className={current === 'tarot' ? `${styles.option} ${styles.active}` : styles.option}
        onClick={() => go('tarot')}
      >
        <CardsGlyph />
        {t('astro:switch.tarot')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={current === 'astro'}
        aria-disabled={ASTRO_ENABLED ? undefined : true}
        className={[
          styles.option,
          current === 'astro' ? styles.active : null,
          ASTRO_ENABLED ? null : styles.locked,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => go('astro')}
      >
        <MoonGlyph />
        {t('astro:switch.astro')}
        {ASTRO_ENABLED ? null : <span className={styles.soon}>{t('astro:switch.soon')}</span>}
      </button>
    </div>
  );
}
