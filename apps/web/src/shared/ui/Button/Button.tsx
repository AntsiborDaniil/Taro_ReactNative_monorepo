import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import type { PressableProps } from 'react-native';
import type { CSSProperties, ReactNode } from 'react';
import { DS_COLORS, DS_SIZES, DS_TYPE, dsFocusRing, dsRadius, dsWebTransition } from 'shared/themes/ds';
import { useKeyboardFocusVisible } from 'shared/lib/web/useKeyboardFocusVisible';
import { Text, TEXT_WEIGHT } from '../Text';

type TButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
};

/** Единственное действие экрана — капсула action500, текст onAction. DS §11. */
function Button({ children, style, disabled, ...rest }: TButtonProps) {
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      {...rest}
      style={(state) => {
        const hovered =
          Platform.OS === 'web' &&
          (state as { hovered?: boolean }).hovered &&
          !disabled;

        return [
          styles.button,
          disabled ? styles.disabled : null,
          Platform.OS === 'web' && !disabled ? styles.cursorPointer : null,
          hovered ? styles.buttonHover : null,
          state.pressed && !disabled ? styles.buttonPressed : null,
          focusVisible ? dsFocusRing : null,
          style,
        ];
      }}
    >
      {typeof children === 'string' ? (
        <Text
          weight={TEXT_WEIGHT.extraBold}
          style={[styles.text, disabled ? styles.textDisabled : null]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: DS_SIZES.buttonHeight,
    borderRadius: dsRadius.capsule(DS_SIZES.buttonHeight),
    backgroundColor: DS_COLORS.action500,
    borderWidth: 0,
    paddingHorizontal: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...dsWebTransition,
  },
  cursorPointer: Platform.select({
    web: { cursor: 'pointer' } as object,
    default: {},
  }),
  buttonHover: Platform.select({
    web: { filter: 'brightness(1.06)' } as object,
    default: {},
  }),
  buttonPressed: Platform.select({
    web: { transform: [{ translateY: 1 }], filter: 'brightness(0.82)' } as object,
    default: { transform: [{ translateY: 1 }], opacity: 0.82 },
  }),
  /** DS: неактивная кнопка — фон ground600, текст ink100, без прозрачности. */
  disabled: {
    backgroundColor: DS_COLORS.ground600,
  },
  text: {
    ...DS_TYPE.button,
    color: DS_COLORS.onAction,
  },
  textDisabled: {
    color: DS_COLORS.ink100,
  },
});

export default Button;
