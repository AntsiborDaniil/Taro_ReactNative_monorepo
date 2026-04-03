import React, { useId } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
import { COLORS } from '../../themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';

type InputProps = {
  errorContent?: string;
  label?: string;
  baseInputProps: TextInputProps;
};

const Input = ({ label, errorContent, baseInputProps = {} }: InputProps) => {
  const { t } = useTranslation();
  const inputId = useId();
  const errorId = errorContent ? `${inputId}-error` : undefined;
  const translatedLabel = label ? t(label) : undefined;

  return (
    <View style={styles.wrapper}>
      {!!translatedLabel && (
        <Text
          category={TEXT_TAGS.label}
          weight={TEXT_WEIGHT.medium}
          style={styles.label}
          // @ts-ignore – web-only: associate <label> with <input>
          nativeID={`${inputId}-label`}
        >
          {translatedLabel}
        </Text>
      )}
      <TextInput
        {...baseInputProps}
        style={[styles.input, !!errorContent && styles.inputError, baseInputProps?.style]}
        placeholderTextColor={COLORS.SpbSky2}
        accessibilityLabel={translatedLabel ?? baseInputProps.accessibilityLabel}
        accessibilityHint={baseInputProps.placeholder as string | undefined}
        // @ts-ignore – web-only: aria-labelledby / aria-errormessage
        aria-labelledby={translatedLabel ? `${inputId}-label` : undefined}
        aria-errormessage={errorId}
        aria-invalid={!!errorContent}
      />
      {!!errorContent && (
        // @ts-ignore
        <Text
          category={TEXT_TAGS.label}
          style={styles.error}
          nativeID={errorId}
          // @ts-ignore
          role="alert"
        >
          {t(errorContent)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: 'relative', gap: 6 },
  label: {
    color: COLORS.SpbSky1,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily: 'Montserrat-Regular',
    borderColor: 'rgba(119,127,133,0.4)',
    borderRadius: 12,
    color: COLORS.Content,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.Background2,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  error: {
    color: '#FF6B6B',
    marginLeft: 4,
    fontSize: 12,
  },
});

export default Input;
