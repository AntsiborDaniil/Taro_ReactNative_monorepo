import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const MAX_CONTENT_WIDTH = 1280;

export type AffirmationsLayout = {
  contentWidth: number;
  padding: number;
  sectionGap: number;
  columnInner: number;
  categoryColumns: number;
  categoryGap: number;
  categoryChipWidth: number;
  categoryChipHeight: number;
  categoryTitleSize: number;
  pickerMaxHeight: number;
  visualSize: number;
  isNarrow: boolean;
  labelFontSize: number;
};

export function useAffirmationsLayout(): AffirmationsLayout {
  const { width: W, height: H } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.min(W, MAX_CONTENT_WIDTH);
    const padding = W < 400 ? 12 : W < 768 ? 14 : 16;
    const sectionGap = W < 640 ? 10 : 12;
    const columnInner = Math.round(contentWidth - 2 * padding);

    const categoryColumns = W < 400 ? 1 : W < 640 ? 2 : W < 1024 ? 3 : 3;
    const categoryGap = W < 640 ? 8 : 10;
    const categoryChipHeight = W < 640 ? 48 : 52;
    const usable = columnInner - categoryGap * (categoryColumns - 1);
    const categoryChipWidth = Math.floor(usable / categoryColumns);

    const categoryTitleSize = W < 640 ? 14 : 15;
    const pickerMaxHeight = Math.round(
      Math.min(280, Math.max(200, H * (W < 640 ? 0.38 : 0.32)))
    );
    const visualSize = Math.round(Math.min(560, Math.max(260, columnInner)));

    return {
      contentWidth,
      padding,
      sectionGap,
      columnInner,
      categoryColumns,
      categoryGap,
      categoryChipWidth,
      categoryChipHeight,
      categoryTitleSize,
      pickerMaxHeight,
      visualSize,
      isNarrow: W < 640,
      labelFontSize: W < 640 ? 14 : 16,
    };
  }, [W, H]);
}
