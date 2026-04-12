import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import { useWindowDimensions } from 'react-native';

export type TabRailLayoutContextValue = {
  /** Текущая ширина левой рейки в px (0, если режим не rail). */
  effectiveRailWidth: number;
  /** Рейка в узком режиме (только иконки). */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const TabRailLayoutContext = createContext<TabRailLayoutContextValue | null>(
  null
);

export function TabRailLayoutProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TabRailLayoutContextValue;
}) {
  return (
    <TabRailLayoutContext.Provider value={value}>
      {children}
    </TabRailLayoutContext.Provider>
  );
}

export function useTabRailLayout() {
  const ctx = useContext(TabRailLayoutContext);
  const { width: windowWidth } = useWindowDimensions();

  return useMemo(() => {
    if (!ctx) {
      return {
        effectiveRailWidth: 0,
        isCollapsed: false,
        toggleCollapsed: () => {},
        sceneContentWidth: windowWidth,
        hasRail: false,
      };
    }

    return {
      ...ctx,
      sceneContentWidth: Math.max(1, windowWidth - ctx.effectiveRailWidth),
      hasRail: ctx.effectiveRailWidth > 0,
    };
  }, [ctx, windowWidth]);
}
