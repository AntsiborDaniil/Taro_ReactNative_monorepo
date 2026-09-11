import { useEffect } from 'react';
import { SpreadContext } from 'entities/Spread';
import { SpreadCardsChoice } from 'pages/spreadDescriptionChoice/ui/SpreadCardsChoice';
import { SpreadName, simpleSpreads } from 'shared/api';
import { useData } from 'shared/DataProvider';

function DayAdvice() {
  const { spread, selectSpread } = useData({
    Context: SpreadContext,
  });

  useEffect(() => {
    if (spread?.id === SpreadName.Simple_DaySuggest) {
      return;
    }
    void selectSpread?.(simpleSpreads.daySuggest);
    // selectSpread is recreated each render — only seed the picker once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SpreadCardsChoice isSimpleSpread />;
}

export default DayAdvice;
