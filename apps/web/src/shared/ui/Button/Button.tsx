import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import type { ButtonProps as KittenButtonProps } from '@ui-kitten/components';
import type { CSSProperties, ReactNode } from 'react';
import { moderateScale } from 'shared/lib';
import { COLORS } from '../../themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';

type TButtonProps = {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
  accessibilityLabel?: string;
} & KittenButtonProps;

function Button({ children, style, accessibilityLabel, ...rest }: TButtonProps) {
  // On web, Pressable renders as div[role="button"]. Browsers only fire
  // click on Enter/Space for <button> elements, not generic role="button" divs.
  // We handle the keydown ourselves so Enter/Space always work.
  const handleKeyDown = Platform.OS === 'web'
    ? (e: any) => {
        const key = e?.nativeEvent?.key ?? e?.key;
        if ((key === 'Enter' || key === ' ') && !rest.disabled) {
          e?.preventDefault?.();
          rest.onPress?.(e);
        }
      }
    : undefined;

  const label = accessibilityLabel ??
    (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!rest.disabled }}
      // @ts-ignore – web-only prop forwarded to DOM element
      onKeyDown={handleKeyDown}
      style={({ pressed, hovered }: any) => [
        styles.button,
        rest.disabled ? styles.disabled : null,
        Platform.OS === 'web' && hovered && !rest.disabled ? styles.hovered : null,
        Platform.OS === 'web' && pressed && !rest.disabled ? styles.pressed : null,
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text
          category={TEXT_TAGS.h3}
          weight={TEXT_WEIGHT.semibold}
          style={styles.text}
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
    borderRadius: 16,
    backgroundColor: COLORS.Primary,
    borderWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    // Web transition via CSS (injected globally)
    ...(Platform.OS === 'web'
      ? ({ transition: 'opacity 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease' } as any)
      : {}),
  },
  hovered: {
    ...(Platform.OS === 'web'
      ? ({
          opacity: 0.9,
          boxShadow: '0 4px 16px rgba(246,192,27,0.35)',
          transform: [{ translateY: -1 }],
        } as any)
      : {}),
  },
  pressed: {
    ...(Platform.OS === 'web'
      ? ({
          opacity: 0.75,
          transform: [{ scale: 0.97 }],
          boxShadow: 'none',
        } as any)
      : {}),
  },
  disabled: {
    opacity: 0.3,
  },
  text: {
    color: COLORS.Background,
    fontSize: moderateScale(14),
  },
});

export default Button;
