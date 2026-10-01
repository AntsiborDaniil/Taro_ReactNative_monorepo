import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import styles from './SmartImage.module.css';

export type SmartImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Запасная картинка, если основная не загрузилась (например, рубашка карты). */
  fallbackSrc?: string;
  /** false — грузить сразу (герой первого экрана); по умолчанию lazy. */
  lazy?: boolean;
};

/**
 * Картинка с заглушками на медленной сети: пока грузится — мягкий скелет DS на месте
 * картинки (тот же className, поэтому размер и позиция совпадают), если не загрузилась —
 * fallbackSrc, а если нет и его — плашка ground-700 с тихой иконкой.
 */
export function SmartImage({ src, alt = '', className, style, fallbackSrc, lazy = true }: SmartImageProps): ReactElement {
  const [current, setCurrent] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setCurrent(src);
    setLoaded(false);
    setFailed(false);
  }, [src]);

  // Картинка уже в кеше браузера — load мог пройти до подписки.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [current]);

  const handleError = () => {
    if (fallbackSrc && current !== fallbackSrc) {
      setCurrent(fallbackSrc);
      return;
    }
    setFailed(true);
  };

  if (!current || failed) {
    return (
      <span className={[className, styles.fallback].filter(Boolean).join(' ')} style={style} role="img" aria-label={alt || undefined}>
        <svg className={styles.fallbackIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="m4 17 5-5 4 4 2.5-2.5L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="15.5" cy="9" r="1.6" fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <img
      ref={imgRef}
      className={[className, loaded ? styles.loaded : styles.loading].filter(Boolean).join(' ')}
      style={style}
      src={current}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  );
}
