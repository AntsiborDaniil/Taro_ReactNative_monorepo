import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

const SCROLL_TOP_SHOW_Y = 72;
const SCROLL_DELTA_HIDE = 8;
const SCROLL_DELTA_SHOW = 6;

type MobileFabScrollContextValue = {
  fabPeekVisible: boolean;
  setFabPeekVisible: (visible: boolean) => void;
};

const MobileFabScrollContext = createContext<MobileFabScrollContextValue | null>(
  null
);

export function MobileFabScrollProvider({ children }: { children: ReactNode }) {
  const [fabPeekVisible, setFabPeekVisible] = useState(true);

  const value = useMemo(
    () => ({ fabPeekVisible, setFabPeekVisible }),
    [fabPeekVisible]
  );

  return (
    <MobileFabScrollContext.Provider value={value}>
      {children}
    </MobileFabScrollContext.Provider>
  );
}

function useMobileFabScrollContext(): MobileFabScrollContextValue | null {
  return useContext(MobileFabScrollContext);
}

/** Attach to root ScrollView on tab screens (web mobile FAB). */
export function useMobileFabScrollOnScroll(): (
  event: NativeSyntheticEvent<NativeScrollEvent>
) => void {
  const ctx = useMobileFabScrollContext();
  const lastYRef = useRef(0);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== 'web' || !ctx) {
        return;
      }

      const y = event.nativeEvent.contentOffset.y;
      const lastY = lastYRef.current;
      const delta = y - lastY;

      if (y <= SCROLL_TOP_SHOW_Y) {
        ctx.setFabPeekVisible(true);
      } else if (delta > SCROLL_DELTA_HIDE) {
        ctx.setFabPeekVisible(false);
      } else if (delta < -SCROLL_DELTA_SHOW) {
        ctx.setFabPeekVisible(true);
      }

      lastYRef.current = y;
    },
    [ctx]
  );
}

export function useMobileFabPeekVisible(): boolean {
  const ctx = useMobileFabScrollContext();
  return ctx?.fabPeekVisible ?? true;
}

/** Show FAB when switching tabs (peek was hidden while scrolling). */
export function useMobileFabRevealOnRouteChange(route: string): void {
  const ctx = useMobileFabScrollContext();

  useEffect(() => {
    ctx?.setFabPeekVisible(true);
  }, [route, ctx]);
}

export const FAB_DISCOVERED_SESSION_KEY = 'taro_web_fab_discovered';

export function readFabDiscoveredFromSession(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    return window.sessionStorage.getItem(FAB_DISCOVERED_SESSION_KEY) === '1';
  } catch {
    return true;
  }
}

export function markFabDiscoveredInSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(FAB_DISCOVERED_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}
