import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getImage } from '@shared/lib/getImage';
import { getCurrentDate } from '@shared/lib/date';
import type { SkyToday } from '@shared/lib/astro/engine';
import { Button, ChevronRightIcon, SmartImage } from '@shared/ui';
import styles from './SkyHero.module.css';

function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Герой «Небо сегодня» — по образцу DayAdvice (картинка с наклонной гранью,
 * на ≥1024 картинка справа 40%; контейнер `astroCol` объявлен на странице).
 * hasProfile определяет, куда ведёт CTA.
 */
export function SkyHero({ sky, hasProfile }: { sky: SkyToday; hasProfile: boolean }): ReactElement {
  const { t } = useTranslation('astro');
  const navigate = useNavigate();
  const dateLabel = capitalizeFirst(getCurrentDate('badge'));
  const moonIn = t(`signIn.${sky.moonSign}`);

  const handleOpen = () => {
    navigate(hasProfile ? '/astro/horoscope' : '/astro/profile?next=/astro/horoscope');
  };

  return (
    <div className={styles.card}>
      <span className={styles.frame}>
        <span className={styles.imageCol}>
          <SmartImage className={styles.image} src={getImage(['spreads', 'flatIllustration', 'period_monthCard'])} lazy={false} />
          <svg className={`${styles.edge} ${styles.edgeStacked}`} preserveAspectRatio="none" viewBox="0 0 100 100.01">
            <line className={styles.edgeLine} x1="0" y1="100" x2="100" y2="80.65" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
          <svg className={`${styles.edge} ${styles.edgeRow}`} preserveAspectRatio="none" viewBox="0 0 28 100">
            <line className={styles.edgeLine} x1="28" y1="0" x2="0" y2="100" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
        <span className={styles.content}>
          <span className={styles.textCol}>
            <h2 className={`${styles.title} ${styles.entryTitle}`}>{t('home.sky.title')}</h2>
            <span className={`${styles.dateLeadGroup} ${styles.entryText}`}>
              <span className={styles.dateText}>
                {dateLabel} · {t('home.sky.moonLine', { in: moonIn, phase: t(`phase.${sky.phase}`) })}
              </span>
              <span className={styles.lead}>
                {t('home.sky.themeLine', { in: moonIn, theme: t(`moonTheme.${sky.moonSign}`) })}
              </span>
            </span>
          </span>
          <span className={`${styles.cta} ${styles.entryCta}`}>
            <Button fullWidth icon={<ChevronRightIcon width={18} height={18} />} iconPosition="end" onClick={handleOpen}>
              {t('home.sky.cta')}
            </Button>
          </span>
        </span>
      </span>
    </div>
  );
}
