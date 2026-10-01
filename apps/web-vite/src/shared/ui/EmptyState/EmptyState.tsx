import type { ReactElement, ReactNode } from 'react';
import styles from './EmptyState.module.css';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Пунктирная оправа + заголовок + действие — пустые списки/состояния. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps): ReactElement {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
