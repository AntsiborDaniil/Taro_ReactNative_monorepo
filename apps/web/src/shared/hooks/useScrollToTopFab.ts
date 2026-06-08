import { useCallback, useRef, useState } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

const DEFAULT_THRESHOLD = 240;

export function useScrollToTopFab(threshold = DEFAULT_THRESHOLD) {
  const scrollRef = useRef<ScrollView>(null);
  const [fabVisible, setFabVisible] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setFabVisible(offsetY > threshold);
    },
    [threshold]
  );

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return { scrollRef, fabVisible, onScroll, scrollToTop };
}
