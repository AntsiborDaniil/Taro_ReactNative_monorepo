import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BASE_W = 375;

function ms(screenW: number, size: number, factor = 0.5) {
  return size + ((screenW / BASE_W) * size - size) * factor;
}

export type MoodAndEnergyLayout = {
  /** Ширина окна — контент на всю ширину экрана */
  contentWidth: number;
  /** Поля от краёв экрана (безузкая колонка) */
  padding: number;
  scrollBottomPad: number;
};

export function useMoodAndEnergyLayout(): MoodAndEnergyLayout {
  const { width: W, height: H } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = W;
    const padding = Math.round(
      Math.min(22, Math.max(12, ms(W, 14)))
    );
    const v = (n: number) => (H / 812) * n;

    return {
      contentWidth,
      padding,
      scrollBottomPad: Math.round(Math.max(28, v(40))),
    };
  }, [W, H]);
}
