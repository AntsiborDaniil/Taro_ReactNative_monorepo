import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SpreadName } from '@entities/spread';
import { useAppSelector } from '@shared/lib/store';
import { ChargeMark } from '@shared/ui';
import { useGetFreeFirstsQuery } from '../api';
import styles from './SpreadPriceTag.module.css';

/** Цена расклада в зарядах: «Для друзей» и «Для влюблённых» ⚡2, остальные ⚡1. */
export function spreadChargeCost(spreadId: string): number {
  return spreadId === SpreadName.Together_Pair || spreadId === SpreadName.Together_Couple ? 2 : 1;
}

/**
 * Ценник поверх картинки каталога/карусели. У «Расклада на двоих» первая пара бесплатна
 * (решает сервер) — вместо ⚡2 тихая метка «бесплатно в первый раз». Гостю метку не
 * показываем: бесплатность принадлежит аккаунту.
 */
export function SpreadPriceTag({ spreadId, className }: { spreadId: string; className?: string }): ReactElement {
  const { t } = useTranslation('together');
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const isPair = spreadId === SpreadName.Together_Pair;
  const { data } = useGetFreeFirstsQuery(undefined, { skip: !isAuthenticated || !isPair });

  if (isPair && data?.pair === true) {
    return <span className={`${styles.freeTag} ${className ?? ''}`}>{t('pair.freeFirstTag')}</span>;
  }
  return <ChargeMark cost={spreadChargeCost(spreadId)} size="xs" overlay className={className} />;
}
