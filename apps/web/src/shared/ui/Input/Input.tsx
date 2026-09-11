import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
import { COLORS, getColorOpacity } from '../../themes';
import { Text, TEXT_TAGS } from '../Text';

type InputProps = {
  errorContent?: string;
  label?: string;
  baseInputProps: TextInputProps;
};

const Input = ({ label, errorContent, baseInputProps = {} }: InputProps) => {
  const hasError = Boolean(errorContent?.trim());

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text category={TEXT_TAGS.p2} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        {...baseInputProps}
        style={[
          styles.input,
          hasError && styles.inputError,
          baseInputProps?.style,
        ]}
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColor={
          baseInputProps.placeholderTextColor ?? 'rgba(255,255,255,0.46)'
        }
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
    color: COLORS.Content,
  },
  input: {
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    borderColor: COLORS.SpbSky1,
    borderRadius: 12,
    color: COLORS.Content,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
    backgroundColor: COLORS.Background2,
  },
  inputError: {
    borderColor: COLORS.Danger400,
    backgroundColor: getColorOpacity(COLORS.Danger500, 8),
  },
  errorText: {
    color: COLORS.Danger400,
    lineHeight: 18,
  },
});

export default Input;
