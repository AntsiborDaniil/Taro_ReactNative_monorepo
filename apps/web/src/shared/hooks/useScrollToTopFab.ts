import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

const DEFAULT_THRESHOLD = 120;

function readScrollOffsetY(): number {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }
  return 0;
}

export function useScrollToTopFab(threshold = DEFAULT_THRESHOLD) {
  const scrollRef = useRef<ScrollView>(null);
  const [fabVisible, setFabVisible] = useState(false);

  const updateVisibility = useCallback(
    (offsetY: number) => {
      setFabVisible(offsetY > threshold);
    },
    [threshold]
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateVisibility(event.nativeEvent.contentOffset.y);
    },
    [updateVisibility]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const onWindowScroll = () => {
      updateVisibility(readScrollOffsetY());
    };

    onWindowScroll();
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, [updateVisibility]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return { scrollRef, fabVisible, onScroll, scrollToTop };
}
