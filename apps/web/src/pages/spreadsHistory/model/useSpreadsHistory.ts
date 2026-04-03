import { useEffect, useMemo, useState } from 'react';
import { getLastSpreadsPackIndex, getSpreadsHistory } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { TSpread } from 'shared/api';
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
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [spreads, setSpreads] = useState<TSpread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();

  const loadMore = async () => {
    if (!currentIndex) {
      return;
    }

    try {
      setLoading(true);

      const newCurrentIndex = currentIndex - 1;
      setCurrentIndex(newCurrentIndex);

      const newPacks = await getSpreadsHistory(newCurrentIndex);

      setSpreads((prevState) => prevState.concat(newPacks));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function getInitialValues() {
      let lastIndex = await getLastSpreadsPackIndex();

      const lastPacks = await getSpreadsHistory(lastIndex);

      if (lastIndex > 0) {
        lastIndex = lastIndex - 1;

        const preLastPacks = await getSpreadsHistory(lastIndex);

        setSpreads([...lastPacks, ...preLastPacks]);
        setCurrentIndex(lastIndex);

        return;
      }

      setSpreads(lastPacks);
      setCurrentIndex(lastIndex);
    }

    getInitialValues();
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
