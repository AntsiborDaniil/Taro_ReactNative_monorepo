import type { ReactElement } from 'react';
import styles from './PageStub.module.css';

export function PageStub({ title }: { title: string }): ReactElement {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
