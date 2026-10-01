import { useEffect, useRef, type ReactElement } from 'react';
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
 * заменён на нативный горизонтальный скролл со scroll-snap.
 *
 * Скролл дорожки — нативный (трекпад/колесо). preventDefault только на
 * горизонтальном overscroll у краёв, иначе Chrome на Mac уводит «назад»
 * по истории. Вручную крутить scrollLeft нельзя: ломаются momentum и deltaMode.
 */
export function TarotSpreadsCarousel({ title, spreads }: TarotSpreadsCarouselProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) {
        event.preventDefault();
        return;
      }

      const atStart = track.scrollLeft <= 0;
      const atEnd = track.scrollLeft >= maxScroll - 1;
      // deltaX < 0 у левого края / deltaX > 0 у правого — overscroll → history gesture.
      if ((atStart && event.deltaX < 0) || (atEnd && event.deltaX > 0)) {
        event.preventDefault();
      }
    };

    track.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => track.removeEventListener('wheel', onWheel, { capture: true });
  }, [spreads.length]);

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
        <div ref={trackRef} className={styles.track}>
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
