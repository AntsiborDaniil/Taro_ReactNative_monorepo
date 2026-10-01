import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartImage } from '@shared/ui';
import styles from './LibraryCard.module.css';

export type LibraryCardProps = {
  title: string;
  subtitle: string;
  img: string;
  to: string;
};

/**
 * Плашка-категория библиотеки (перенос apps/web CategoryCard без RN):
 * картинка-обложка сверху, подпись снизу, вся плашка кликабельна.
 */
export function LibraryCard({ title, subtitle, img, to }: LibraryCardProps): ReactElement {
  const navigate = useNavigate();

  return (
    <button type="button" className={styles.card} onClick={() => navigate(to)} aria-label={`${title}, ${subtitle}`}>
      <span className={styles.imageFrame}>
        <span className={styles.imageInner}><SmartImage className={styles.image} src={img} /></span>
      </span>
      <span className={styles.textCol}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
    </button>
  );
}
