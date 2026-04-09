import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import type { ButtonProps as KittenButtonProps } from '@ui-kitten/components';
import type { CSSProperties, ReactNode } from 'react';
import { moderateScale } from 'shared/lib';
import { COLORS } from '../../themes';
import { Text, TEXT_TAGS } from '../Text';

type TButtonProps = {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
} & KittenButtonProps;

function Button({ children, style, ...rest }: TButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.button, rest.disabled ? styles.disabled : null, style]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text category={TEXT_TAGS.h3} style={styles.text}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
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
  disabled: {
    opacity: 0.3,
  },
  text: {
    color: COLORS.Background,
    fontSize: moderateScale(14),
  },
});

export default Button;
