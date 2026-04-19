import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import type { PressableProps } from 'react-native';
import type { CSSProperties, ReactNode } from 'react';
import { COLORS } from '../../themes';
import { Text, TEXT_TAGS } from '../Text';

type TButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
};

function Button({ children, style, disabled, ...rest }: TButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
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
          style,
        ];
      }}
    >
      {typeof children === 'string' ? (
        <Text category={TEXT_TAGS.h3} style={styles.text}>
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
    borderRadius: 16,
    backgroundColor: COLORS.Primary,
    borderWidth: 0,
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorPointer: Platform.select({
    web: { cursor: 'pointer' } as object,
    default: {},
  }),
  buttonHover: Platform.select({
    web: {
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
      filter: 'brightness(1.07)',
    } as object,
    default: {},
  }),
  buttonPressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.3,
  },
  text: {
    color: COLORS.Background,
  },
});

export default Button;
