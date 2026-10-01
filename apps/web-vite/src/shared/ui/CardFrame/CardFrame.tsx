import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import styles from './CardFrame.module.css';

export type CardFrameProps = HTMLAttributes<HTMLDivElement> & {
  /** Явная ширина в px; без пропа оправа = 100% родителя. */
  width?: number;
};

/**
 * Оправа карты DS §07: радиус 9% ширины, кант ground600, hover accent400.
 * Радиус — на внутреннем слое (.inner) через 9cqw от .frame-контейнера:
 * cqw-юниты на самом элементе с container-type резолвятся от ближайшего
 * ancestor-контейнера, а не от себя, поэтому граница+радиус не могут жить
 * на том же узле, что задаёт container-type.
 */
export function CardFrame({ width, style, className, children, ...rest }: CardFrameProps): ReactElement {
  const mergedStyle: CSSProperties | undefined = width != null ? { ...style, width } : style;

  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')} style={mergedStyle} {...rest}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
