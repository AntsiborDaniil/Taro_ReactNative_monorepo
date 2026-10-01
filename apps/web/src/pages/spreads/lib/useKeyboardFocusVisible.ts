import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

/**
 * react-native-web помечает Pressable «focused» при любом получении фокуса,
 * в том числе по клику мышью/тачем (см. usePressEvents/useHover в самой либе —
 * `:focus-visible` там не используется). DS требует кольцо фокуса только при
 * навигации с клавиатуры. Эвристика: если фокус пришёл раньше чем через
 * `POINTER_GUARD_MS` после последнего pointerdown — это клик, не Tab.
 */
const POINTER_GUARD_MS = 250;

let lastPointerDownAt = 0;
let globalListenersReady = false;

function trackPointerDown() {
  lastPointerDownAt = Date.now();
}

function ensureGlobalListeners() {
  if (
    globalListenersReady ||
    Platform.OS !== 'web' ||
    typeof document === 'undefined'
  ) {
    return;
  }
  globalListenersReady = true;
  document.addEventListener('pointerdown', trackPointerDown, true);
  document.addEventListener('mousedown', trackPointerDown, true);
  document.addEventListener('touchstart', trackPointerDown, true);
}

/** Кольцо фокуса — только при Tab-навигации, не при клике/тапе. Web-only, на native — всегда false (нативный фокус подсвечивается ОС). */
export function useKeyboardFocusVisible() {
  ensureGlobalListeners();
  const [focusVisible, setFocusVisible] = useState(false);

  const onFocus = useCallback(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const sincePointer = Date.now() - lastPointerDownAt;
    setFocusVisible(sincePointer > POINTER_GUARD_MS);
  }, []);

  const onBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  return { focusVisible, onFocus, onBlur };
}
