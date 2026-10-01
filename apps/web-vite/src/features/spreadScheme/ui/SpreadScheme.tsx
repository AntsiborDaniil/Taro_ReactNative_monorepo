import type { ReactElement } from 'react';
import type { SpreadName } from '@legacy-data';
import { SPREAD_SCHEME_LAYOUTS, type SchemeBlock } from '../model/layouts';
import styles from './SpreadScheme.module.css';

function Cell({ index }: { index: number }): ReactElement {
  return <span className={styles.cell}>{index + 1}</span>;
}

function Block({ block }: { block: SchemeBlock }): ReactElement {
  if ('cells' in block) {
    return (
      <div className={styles.row}>
        {block.cells.map((index) => (
          <Cell key={index} index={index} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.columns}>
      {block.columns.map((column, columnIndex) => (
        <div key={columnIndex} className={styles.column}>
          {column.map((sub, subIndex) => (
            <Block key={subIndex} block={sub} />
          ))}
        </div>
      ))}
    </div>
  );
}

export type SpreadSchemeProps = {
  spreadId: SpreadName | string;
  className?: string;
};

/**
 * Визуальная схема позиций карт (пункт 5) — перенос ФОРМЫ раскладки из
 * apps/web/src/features/scheme (10 файлов SchemeMapping), данные —
 * model/layouts.ts. Для раскладов без записи в SPREAD_SCHEME_LAYOUTS (как и
 * в старом SchemeMapping) компонент ничего не рендерит — остаётся текстовый
 * список позиций (SpreadDetailPage).
 */
export function SpreadScheme({ spreadId, className }: SpreadSchemeProps): ReactElement | null {
  const layout = SPREAD_SCHEME_LAYOUTS[spreadId as SpreadName];
  if (!layout) return null;

  return (
    <div className={[styles.scheme, className].filter(Boolean).join(' ')}>
      {layout.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
