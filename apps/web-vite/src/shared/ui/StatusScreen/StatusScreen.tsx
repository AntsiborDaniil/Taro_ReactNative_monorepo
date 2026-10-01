import type { ReactElement, ReactNode } from 'react';
import { Text } from '../Text';
import { SmartImage } from '../SmartImage';
import styles from './StatusScreen.module.css';

export type StatusScreenProps = {
  image?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Полноэкранная карточка-состояние (перенос визуала apps/web/src/pages/
 * errorBoundary/ui/TarotErrorBoundary.tsx §«Пустое состояние DS») — переиспользуется
 * страницами 404 (pages/notFound) и роутер-ошибкой (pages/errorBoundary).
 */
export function StatusScreen({ image, title, description, action }: StatusScreenProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <SmartImage className={styles.image} src={image} />
        <Text role="title" as="h1" className={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text role="body" tone="ink100" className={styles.description}>
            {description}
          </Text>
        ) : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </div>
  );
}
