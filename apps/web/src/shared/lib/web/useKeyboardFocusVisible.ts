import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Полифилл `:focus-visible` для RN Web Pressable/TextInput (нет доступа к CSS-псевдоклассу
 * из инлайн-стилей). Отслеживает последний тип ввода глобально: любая клавиша —
 * «клавиатура», любой pointerdown/mousedown — «мышь». Кольцо фокуса (DS §11, бирюза,
 * `dsFocusRing`) показывается только когда элемент получил фокус после ввода с клавиатуры.
 */
let lastInputWasKeyboard = true;
let listenersAttached = false;

function attachGlobalListeners() {
  if (listenersAttached || Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }
  listenersAttached = true;

  const onKeyDown = () => {
    lastInputWasKeyboard = true;
  };
  const onPointerDown = () => {
    lastInputWasKeyboard = false;
  };

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
}

export function useKeyboardFocusVisible() {
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    attachGlobalListeners();
  }, []);

  const onFocus = () => {
    setFocusVisible(Platform.OS !== 'web' || lastInputWasKeyboard);
  };

  const onBlur = () => {
    setFocusVisible(false);
  };

  return { focusVisible, onFocus, onBlur };
}
