import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  freePeriodKindOf,
  getFreePeriodCard,
  openSavedSpread,
  saveFreePeriodCard,
  selectSpread,
  spreadFromSavedFreeCard,
  useGetFreeCardsQuery,
  type FreePeriodStatus,
  type TSpread,
} from '@entities/spread';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';

export type FreeCardState = {
  /** Карта этого периода уже открыта (локально или по данным сервера). */
  used: boolean;
  /** Когда откроется следующая (UTC ISO), если сервер ответил. */
  nextAt: string | null;
};

/**
 * Открыть бесплатную карту периода (дня/недели/месяца):
 * 1) есть локальный кэш этого периода — показываем его;
 * 2) сервер говорит «уже открыта» (другое устройство) — восстанавливаем из ответа;
 * 3) иначе — новый расклад (/reading). Источник истины — сервер (одна карта на период).
 */
export function useOpenFreePeriodCard(): {
  open: (spread: TSpread) => void;
  stateOf: (spread: TSpread) => FreeCardState;
} {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: statuses } = useGetFreeCardsQuery(undefined, { skip: !isAuthenticated });

  const statusOf = useCallback(
    (spread: TSpread): FreePeriodStatus | undefined => {
      const kind = freePeriodKindOf(spread.id);
      return kind ? statuses?.find((s) => s.kind === kind) : undefined;
    },
    [statuses],
  );

  const stateOf = useCallback(
    (spread: TSpread): FreeCardState => {
      const kind = freePeriodKindOf(spread.id);
      if (!kind) return { used: false, nextAt: null };
      const status = statusOf(spread);
      return { used: Boolean(getFreePeriodCard(kind)) || status?.available === false, nextAt: status?.nextAt ?? null };
    },
    [statusOf],
  );

  const open = useCallback(
    (spread: TSpread) => {
      // С экрана описания карты (/spreads/:id) — заменяем его: «назад» с результата
      // ведёт в каталог, а не снова на описание уже открытой карты.
      const replace = pathname.startsWith('/spreads/');
      const kind = freePeriodKindOf(spread.id);
      if (kind) {
        const local = getFreePeriodCard(kind);
        if (local) {
          dispatch(openSavedSpread(local));
          navigate('/reading/result', { replace });
          return;
        }
        const saved = statusOf(spread)?.saved;
        const restored = saved ? spreadFromSavedFreeCard(spread, saved) : null;
        if (restored) {
          saveFreePeriodCard(kind, restored);
          dispatch(openSavedSpread(restored));
          navigate('/reading/result', { replace });
          return;
        }
      }
      dispatch(selectSpread(spread));
      navigate('/reading', { replace });
    },
    [dispatch, navigate, statusOf, pathname],
  );

  return { open, stateOf };
}
