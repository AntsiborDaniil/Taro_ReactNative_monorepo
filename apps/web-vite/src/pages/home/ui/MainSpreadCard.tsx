import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { selectSpread, type TSpread } from '@entities/spread';
import { useAppDispatch } from '@shared/lib/store';
import { getImage, DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { SmartImage } from '@shared/ui';
import styles from './TarotSpreadsCarousel.module.css';

export function MainSpreadCard({ spread }: { spread: TSpread }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const name = t(spread.name);
  const cardsLabel = t('main:spreadCardsCount', { count: spread.cardsCount });
  const img = getImage(['spreadsSmall', DECK_STYLE_FLAT, spread.id]);

  const handleClick = () => {
    track(AnalyticAction.ClickPopularMainPage, { spread: spread.name, isLocked: false });
    dispatch(selectSpread(spread));
    navigate(`/spreads/${spread.id}`);
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={handleClick}
      aria-label={t('main:spreadCard.a11y', { name, cards: cardsLabel })}
    >
      <span className={styles.imageFrame}>
        <span className={styles.imageInner}>
          <SmartImage className={styles.image} src={img} />
        </span>
      </span>
      <span className={styles.textCol}>
        <span className={styles.name}>{name}</span>
        <span className={styles.cardsCount}>{cardsLabel}</span>
      </span>
    </button>
  );
}
