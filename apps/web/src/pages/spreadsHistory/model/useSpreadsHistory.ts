import { useEffect, useMemo, useState } from 'react';
import { getLastSpreadsPackIndex, getSpreadsHistoryPage } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { TSpread } from 'shared/api';
import { TAROT_AUTH_CHANGED_EVENT } from 'shared/lib/tarotAuthEvents';
import { formatDate } from '../lib';

type TSpreadSection = {
  title: string;
  data: TSpread[];
};

type TSpreadsHistoryHookResult = {
  loading: boolean;
  spreadsSections: TSpreadSection[];
  loadMore: () => Promise<void>;
};

export function useSpreadsHistory(): TSpreadsHistoryHookResult {
  const [spreads, setSpreads] = useState<TSpread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [usesCloud, setUsesCloud] = useState(false);
  const [cloudOffset, setCloudOffset] = useState(0);
  const [cloudHasMore, setCloudHasMore] = useState(false);
  const [localPackIndex, setLocalPackIndex] = useState<number | null>(null);

  const { t } = useTranslation();

  const loadInitial = async () => {
    const firstPage = await getSpreadsHistoryPage({ limit: 40, offset: 0 });
    setUsesCloud(firstPage.usesCloud);
    setSpreads(firstPage.spreads);
    setCloudOffset(firstPage.nextOffset);
    setCloudHasMore(firstPage.hasMore);

    if (!firstPage.usesCloud) {
      const lastIndex = await getLastSpreadsPackIndex();
      if (lastIndex > 0) {
        const previousPage = await getSpreadsHistoryPage({
          packIndex: lastIndex - 1,
        });
        setSpreads([...firstPage.spreads, ...previousPage.spreads]);
        setLocalPackIndex(lastIndex - 1);
      } else {
        setLocalPackIndex(lastIndex);
      }
    }
  };

  const loadMore = async () => {
    try {
      setLoading(true);

      if (usesCloud) {
        if (!cloudHasMore) {
          return;
        }

        const page = await getSpreadsHistoryPage({
          limit: 20,
          offset: cloudOffset,
        });

        setSpreads((prev) => prev.concat(page.spreads));
        setCloudOffset(page.nextOffset);
        setCloudHasMore(page.hasMore);
        return;
      }

      if (localPackIndex === null || localPackIndex <= 0) {
        return;
      }

      const newIndex = localPackIndex - 1;
      setLocalPackIndex(newIndex);

      const page = await getSpreadsHistoryPage({ packIndex: newIndex });
      setSpreads((prev) => prev.concat(page.spreads));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onAuthChanged = () => {
      void loadInitial();
    };

    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, []);

  const spreadsSections = useMemo(() => {
    return spreads.reduce((acc: TSpreadSection[], currentValue) => {
      if (!currentValue.date || !currentValue.uid) {
        return acc;
      }

      const day = formatDate({
        dateStr: currentValue.date,
        yesterdayText: t('core:yesterday'),
        todayText: t('core:today'),
      });

      if (acc[acc.length - 1]?.title === day) {
        acc[acc.length - 1].data.push(currentValue);

        return acc;
      }

      acc.push({ title: day, data: [currentValue] });

      return acc;
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreads]);

  return {
    loading,
    spreadsSections,
    loadMore,
  };
}
