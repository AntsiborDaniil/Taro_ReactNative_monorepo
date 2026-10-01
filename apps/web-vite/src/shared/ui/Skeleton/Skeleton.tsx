import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
  radius?: number;
  variant?: 'block' | 'circle';
};

/** DS-плейсхолдер: ground700/ground600, очень мягкий блик; reduced-motion — статично. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 10,
  variant = 'block',
  className,
  style,
  ...rest
}: SkeletonProps): ReactElement {
  const mergedStyle: CSSProperties = {
    width,
    height,
    borderRadius: variant === 'circle' ? '50%' : radius,
    ...style,
  };

  return (
    <div
      className={[styles.skeleton, variant === 'circle' ? styles.circle : null, className].filter(Boolean).join(' ')}
      style={mergedStyle}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function SkeletonRow({
  gap = 12,
  children,
  className,
  style,
}: {
  gap?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}): ReactElement {
  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')} style={{ gap, ...style }}>
      {children}
    </div>
  );
}
