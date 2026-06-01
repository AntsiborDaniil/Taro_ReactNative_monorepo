import { useCallback, useRef } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { COLORS } from 'shared/themes';

const CODE_LENGTH = 6;

type VerifyCodeBoxesProps = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

export function VerifyCodeBoxes({
  value,
  onChange,
  disabled = false,
}: VerifyCodeBoxesProps) {
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? '');

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const applyDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join('').slice(0, CODE_LENGTH));
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      applyDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH).split('');
      const next = [...digits];
      pasted.forEach((ch, offset) => {
        if (index + offset < CODE_LENGTH) {
          next[index + offset] = ch;
        }
      });
      applyDigits(next);
      const lastFilled = Math.min(index + pasted.length, CODE_LENGTH - 1);
      focusIndex(lastFilled);
      return;
    }

    const next = [...digits];
    next[index] = cleaned[0] ?? '';
    applyDigits(next);
    if (index < CODE_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }
    if (digits[index]) {
      const next = [...digits];
      next[index] = '';
      applyDigits(next);
      return;
    }
    if (index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      applyDigits(next);
      focusIndex(index - 1);
    }
  };

  const handleBoxPress = useCallback(
    (index: number) => {
      if (!disabled) {
        focusIndex(index);
      }
    },
    [disabled]
  );

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <Pressable
          key={index}
          onPress={() => handleBoxPress(index)}
          style={[
            styles.box,
            digit ? styles.boxFilled : null,
            disabled ? styles.boxDisabled : null,
          ]}
        >
          <TextInput
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={digit}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event)}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            editable={!disabled}
            selectTextOnFocus
            caretHidden
            style={styles.input}
            accessibilityLabel={`Digit ${index + 1}`}
          />
        </Pressable>
      ))}
    </View>
  );
}

const BOX_SIZE = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(128, 174, 226, 0.45)',
    backgroundColor: 'rgba(12, 22, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: COLORS.Primary,
    backgroundColor: 'rgba(102, 154, 211, 0.18)',
  },
  boxDisabled: {
    opacity: 0.55,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.Content,
    padding: 0,
  },
});
