import type { ReactElement } from 'react';
import { Skeleton } from '../Skeleton';
import styles from './PageSkeleton.module.css';

/**
 * Заглушка страницы, пока грузится её код (lazy-маршрут) на медленной сети:
 * шапка, заголовок, строки списка и плитки — формы DS, без спиннера (DS §11).
 */
export function PageSkeleton(): ReactElement {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.column}>
        <div className={styles.header}>
          <Skeleton variant="circle" width={44} height={44} />
          <Skeleton width="40%" height={24} radius={8} />
          <Skeleton variant="circle" width={44} height={44} />
        </div>
        <Skeleton height={180} radius={20} />
        <div className={styles.rows}>
          <Skeleton height={64} radius={18} />
          <Skeleton height={64} radius={18} />
        </div>
        <div className={styles.tiles}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} height="auto" radius={12} style={{ aspectRatio: '1 / 1' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
