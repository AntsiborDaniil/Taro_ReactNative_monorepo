import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@shared/lib/store';
import { CloseIcon } from '../Icon';
import styles from './SlowConnectionBanner.module.css';

/** Запрос данных дольше этого — считаем сеть медленной. */
const SLOW_REQUEST_MS = 5000;
const DISMISS_KEY = 'tarot_slow_connection_banner_dismissed';

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function connection(): NetworkInformation | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/** Перенос apps/web useSlowConnection: экономия трафика или 2g/3g по Network Information API. */
function readSlowNetwork(): boolean {
  const info = connection();
  if (!info) return false;
  if (info.saveData) return true;
  return ['slow-2g', '2g', '3g'].includes(info.effectiveType ?? '');
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Баннер «Медленное соединение — загружаем данные…» (перенос apps/web SlowConnectionBanner).
 * Показывается, если браузер сообщает о медленной сети, или если запрос данных висит
 * дольше 5 с (Network Information API есть не везде, например, нет в Safari). Мутации
 * (запрос к AI) не учитываются — для них свой экран ожидания. Скрыть — до конца сессии.
 */
export function SlowConnectionBanner(): ReactElement | null {
  const { t } = useTranslation('core');
  const [slowNetwork, setSlowNetwork] = useState(readSlowNetwork);
  const [slowRequest, setSlowRequest] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  // Самый ранний старт среди висящих запросов данных (RTK Query, reducerPath 'api').
  const oldestPending = useAppSelector((state) => {
    let oldest: number | null = null;
    for (const query of Object.values(state.api.queries)) {
      if (query?.status === 'pending' && typeof query.startedTimeStamp === 'number') {
        oldest = oldest === null ? query.startedTimeStamp : Math.min(oldest, query.startedTimeStamp);
      }
    }
    return oldest;
  });

  useEffect(() => {
    const info = connection();
    if (!info?.addEventListener) return;
    const onChange = () => setSlowNetwork(readSlowNetwork());
    info.addEventListener('change', onChange);
    return () => info.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (oldestPending === null) {
      setSlowRequest(false);
      return;
    }
    const wait = SLOW_REQUEST_MS - (Date.now() - oldestPending);
    if (wait <= 0) {
      setSlowRequest(true);
      return;
    }
    const timer = window.setTimeout(() => setSlowRequest(true), wait);
    return () => window.clearTimeout(timer);
  }, [oldestPending]);

  if (dismissed || !(slowNetwork || slowRequest)) return null;

  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>{t('slowConnection.hint')}</span>
      <button
        type="button"
        className={styles.close}
        aria-label={t('slowConnection.dismiss')}
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, '1');
          } catch {
            // приватный режим — скрываем только до перезагрузки
          }
          setDismissed(true);
        }}
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
