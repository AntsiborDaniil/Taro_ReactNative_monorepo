import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

const MOVE_THRESHOLD_PX = 10;

type PointerLikeEvent = {
  nativeEvent: { clientX: number; clientY: number };
};

/**
 * Web: tap without Pressable — vertical swipes scroll the parent ScrollView.
 * Pressable/Touchable attach responders that block touch-action pan-y on mobile.
 */
export function useWebScrollFriendlyPress(onPress: () => void) {
  const gesture = useRef({ x: 0, y: 0, moved: false });

  const onPointerDown = useCallback((event: PointerLikeEvent) => {
    gesture.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback((event: PointerLikeEvent) => {
    if (gesture.current.moved) {
      return;
    }

    const dx = Math.abs(event.nativeEvent.clientX - gesture.current.x);
    const dy = Math.abs(event.nativeEvent.clientY - gesture.current.y);

    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      gesture.current.moved = true;
    }
  }, []);

  const onPointerEnd = useCallback(() => {
    if (!gesture.current.moved) {
      onPress();
    }
  }, [onPress]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  };
}
