import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import styles from './Tile.module.css';

export type TileProps = HTMLAttributes<HTMLDivElement> & {
  /** Ширина в px; радиус = 4% ширины. Без пропа — через container query (4cqw). */
  width?: number;
};

/** Внутреннее «окно» карты DS: радиус 4% ширины. */
export function Tile({ width, style, className, children, ...rest }: TileProps): ReactElement {
  const mergedStyle: CSSProperties = {
    ...style,
    ...(width != null ? { width, borderRadius: Math.round(width * 0.04) } : undefined),
  };

  return (
    <div className={[styles.tile, className].filter(Boolean).join(' ')} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
}
