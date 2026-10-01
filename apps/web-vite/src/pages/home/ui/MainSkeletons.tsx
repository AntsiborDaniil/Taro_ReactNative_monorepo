import type { ReactElement } from 'react';
import { Skeleton } from '@shared/ui';
import styles from './MainSkeletons.module.css';

/** Fallback-скелеты на время отложенного монтирования тяжёлых блоков главной (DeferredMount). */

export function QuickLinksSkeleton(): ReactElement {
  return (
    <div className={styles.list} aria-hidden="true">
      <Skeleton height={64} radius={18} />
      <Skeleton height={64} radius={18} />
    </div>
  );
}

export function SpreadsSkeleton(): ReactElement {
  return (
    <div className={styles.spreadsWrap} aria-hidden="true">
      <Skeleton width={160} height={44} radius={8} />
      <div className={styles.spreadsRow}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.spreadsTile}>
            <Skeleton height={148} radius={10} />
            <Skeleton width="90%" height={16} radius={4} />
            <Skeleton width="55%" height={12} radius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WidgetSkeleton({ tall = false }: { tall?: boolean }): ReactElement {
  return <Skeleton height={tall ? 160 : 120} radius={18} aria-hidden="true" />;
}
