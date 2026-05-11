import type { PressableStateCallbackType } from 'react-native';

/** Состояние Pressable на web (react-native-web добавляет `hovered`). */
export type PressableWebState = PressableStateCallbackType & {
  hovered?: boolean;
};
