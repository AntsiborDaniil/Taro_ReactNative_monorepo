import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
import { DS_COLORS, DS_SIZES, DS_TYPE, dsFocusRing, dsWebTransition } from 'shared/themes/ds';
import { useKeyboardFocusVisible } from 'shared/lib/web/useKeyboardFocusVisible';
import { Text, TEXT_TAGS } from '../Text';

type InputProps = {
  errorContent?: string;
  label?: string;
  baseInputProps: TextInputProps;
};

/** Поле DS §11: h74, r24, рамка 1.6/2.4 фокус calm500, ошибка alarm600 под полем. */
const Input = ({ label, errorContent, baseInputProps = {} }: InputProps) => {
  const hasError = Boolean(errorContent?.trim());
  const [focused, setFocused] = useState(false);
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text category={TEXT_TAGS.p2} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        {...baseInputProps}
        onFocus={(e) => {
          setFocused(true);
          onFocus();
          baseInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur();
          baseInputProps.onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          focused && focusVisible && dsFocusRing,
          hasError && styles.inputError,
          baseInputProps?.style,
        ]}
        placeholderTextColor={baseInputProps.placeholderTextColor ?? `${DS_COLORS.ink100}99`}
      />
      {hasError ? (
        <Text category={TEXT_TAGS.label} style={styles.errorText}>
          {errorContent}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: 'relative', gap: 8 },
  label: {
    color: DS_COLORS.ink50,
  },
  input: {
    borderWidth: DS_SIZES.fieldBorder,
    borderStyle: 'solid',
    ...DS_TYPE.body,
    borderColor: DS_COLORS.ground600,
    borderRadius: DS_SIZES.fieldRadius,
    color: DS_COLORS.ink50,
    paddingHorizontal: 20,
    minHeight: DS_SIZES.fieldHeight,
    backgroundColor: DS_COLORS.ground700,
    ...dsWebTransition,
  },
  inputFocused: {
    borderWidth: DS_SIZES.fieldBorderFocus,
    borderColor: DS_COLORS.calm500,
  },
  inputError: {
    borderColor: DS_COLORS.alarm600,
  },
  errorText: {
    color: DS_COLORS.alarm600,
    lineHeight: 18,
  },
});

export default Input;
