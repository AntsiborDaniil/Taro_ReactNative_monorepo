import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TSpread } from '@entities/spread';
import { ChevronRightIcon } from '@shared/ui';
import { MainSpreadCard } from './MainSpreadCard';
import styles from './TarotSpreadsCarousel.module.css';

type TarotSpreadsCarouselProps = {
  title: string;
  spreads: TSpread[];
};

/**
 * Перенос apps/web/src/pages/main/ui/TarotSpreadsCarousel — RN Carousel
 * заменён на нативный горизонтальный скролл со scroll-snap (то же поведение
 * для пользователя: свайп/колесо, без библиотеки).
 */
export function TarotSpreadsCarousel({ title, spreads }: TarotSpreadsCarouselProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>{title}</h2>
        <button type="button" className={styles.allLink} onClick={() => navigate('/spreads')}>
          <span>{t('main:allSpreads')}</span>
          <ChevronRightIcon width={16} height={16} />
        </button>
      </div>

      {spreads.length ? (
        <div className={styles.track}>
          {spreads.map((spread) => (
            <MainSpreadCard key={spread.id} spread={spread} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{title}</p>
          <button type="button" className={styles.allLink} onClick={() => navigate('/spreads')}>
            <span>{t('main:allSpreads')}</span>
            <ChevronRightIcon width={16} height={16} />
          </button>
        </div>
      )}
    </section>
  );
}
