import type { ReactElement } from 'react';
import styles from './StarField.module.css';

/** Тихий слой неподвижных «звёзд» за контентом страницы астро-мира (без мерцания). */
export function StarField(): ReactElement {
  return <div className={styles.stars} aria-hidden="true" />;
}
