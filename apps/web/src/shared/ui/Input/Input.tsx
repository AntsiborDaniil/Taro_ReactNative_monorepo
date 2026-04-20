import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
import { COLORS } from '../../themes';
import { Text } from '../Text';

type InputProps = {
  errorContent?: string;
  label?: string;
  baseInputProps: TextInputProps;
};

const Input = ({ label, baseInputProps = {} }: InputProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      {!!label && <Text>{t(label)}</Text>}
      <TextInput
        {...baseInputProps}
        style={[styles.input, baseInputProps?.style]}
        placeholderTextColor={
          baseInputProps.placeholderTextColor ?? 'rgba(255,255,255,0.46)'
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: 'relative', gap: 8 },
  input: {
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    borderColor: COLORS.SpbSky1,
    borderRadius: 12,
    color: COLORS.Content,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
    backgroundColor: COLORS.Background2,
  },
});

export default Input;
