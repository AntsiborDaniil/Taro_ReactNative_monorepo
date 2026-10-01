import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './AILoader.module.css';

const LOADING_TEXTS = ['loading.1', 'loading.2', 'loading.3', 'loading.4', 'loading.5'];
const TEXT_INTERVAL = 3000;
const SEGMENTS = 5;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ожидание ответа AI (перенос apps/web/src/shared/ui/AIAnimation): полноэкранное
 * видео из public/videos (loader.mp4, в 20% случаев loaderCar.mp4), поверх —
 * карточка DS с сегментами, «Подождите чуть-чуть…» и фразой, сменяющейся раз в 3 с.
 * Пока видео грузится или если не загрузилось — ровный фон ground-900 (заглушка).
 * На десктопе кадр вписывается целиком (contain), без растягивания лица.
 * prefers-reduced-motion — без видео и без анимации сегментов.
 */
export function AILoader(): ReactElement | null {
  const { t } = useTranslation('core');
  const [textKey, setTextKey] = useState(LOADING_TEXTS[0]);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const src = useMemo(() => (Math.random() < 0.2 ? '/videos/loaderCar.mp4' : '/videos/loader.mp4'), []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTextKey(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    }, TEXT_INTERVAL);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const onChange = () => setDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Пока идёт ожидание, страница под оверлеем не прокручивается.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.root} role="status" aria-live="polite">
      {!reducedMotion && !videoFailed ? (
        <div className={styles.stage}>
          <video
            className={[styles.video, videoReady ? styles.videoReady : ''].join(' ')}
            style={
              desktop
                ? ({
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    width: 'auto',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: aspectRatio ? String(aspectRatio) : '9 / 16',
                  } as CSSProperties)
                : ({ objectFit: 'cover', objectPosition: 'center center' } as CSSProperties)
            }
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                setAspectRatio(video.videoWidth / video.videoHeight);
              }
            }}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        </div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.segments} aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span key={index} className={styles.segment} style={{ animationDelay: `${index * 140}ms` }} />
          ))}
        </div>
        <p className={styles.title}>{`${t('loading.default')}...`}</p>
        <p key={textKey} className={styles.subtitle}>
          {t(textKey)}
        </p>
      </div>
    </div>,
    document.body,
  );
}
