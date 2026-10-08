import { useEffect, useMemo, useState } from 'react';
import {
  getLastLocalPackIndex,
  getLocalHistoryPack,
  useListSpreadsHistoryQuery,
  type TSpread,
} from '@entities/spread';
import { useAppSelector } from '@shared/lib/store';

const PAGE = 100;
const MAX_LIMIT = 500;

/**
 * Расклады для зеркала: облако для авторизованного (лимит растёт, пока не дойдём
 * до начала окна) и локальные пачки spreadsPack_<n> для гостя.
 * @param rangeStart начало окна — подгружаем историю, пока самая старая запись новее него.
 */
export function useMirrorSpreads(rangeStart: Date): { spreads: TSpread[]; loading: boolean } {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const [limit, setLimit] = useState(PAGE);

  const { data: cloud, isFetching } = useListSpreadsHistoryQuery(
    { limit, offset: 0 },
    { skip: !isAuthenticated },
  );

  useEffect(() => {
    if (!cloud || cloud.length < limit || limit >= MAX_LIMIT) return;
    const oldest = cloud[cloud.length - 1]?.date;
    if (oldest && new Date(oldest).getTime() > rangeStart.getTime()) {
      setLimit((prev) => prev + PAGE);
    }
  }, [cloud, limit, rangeStart]);

  const local = useMemo(() => {
    if (isAuthenticated) return [];
    const result: TSpread[] = [];
    for (let index = getLastLocalPackIndex(); index >= 0; index -= 1) {
      result.push(...getLocalHistoryPack(index));
    }
    return result;
  }, [isAuthenticated]);

  return {
    spreads: isAuthenticated ? (cloud ?? []) : local,
    loading: sessionLoading || (isAuthenticated && isFetching && !cloud),
  };
}
