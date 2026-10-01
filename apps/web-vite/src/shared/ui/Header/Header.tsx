import type { ReactElement, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '../Text';
import { ChevronLeftIcon } from '../Icon';
import { CreditsBadge } from './CreditsBadge';
import styles from './Header.module.css';

export type HeaderProps = {
  title: string;
  /** По умолчанию true; кнопка «назад» вызывает onBack или useNavigate(-1). */
  showBack?: boolean;
  onBack?: () => void;
  /** Правый слот (кастомное действие) — рендерится после CreditsBadge. */
  right?: ReactNode;
  showCredits?: boolean;
};

/** Шапка экрана DS: «назад» слева, заголовок по центру, CreditsBadge + right справа. */
export function Header({ title, showBack = true, onBack, right, showCredits = true }: HeaderProps): ReactElement {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Зашли по прямой ссылке (истории внутри приложения нет) — на главную, а не прочь с сайта.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.side}>
        {showBack ? (
          <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Назад">
            <ChevronLeftIcon width={24} height={24} />
          </button>
        ) : (
          <span className={styles.sideSpacer} aria-hidden="true" />
        )}
      </div>
      <Text role="title" as="h1" className={styles.title} truncate>
        {title}
      </Text>
      <div className={`${styles.side} ${styles.sideEnd}`}>
        {showCredits ? <CreditsBadge /> : null}
        {right}
      </div>
    </header>
  );
}
