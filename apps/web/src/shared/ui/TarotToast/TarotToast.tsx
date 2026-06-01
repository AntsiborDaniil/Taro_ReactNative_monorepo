import Toast, { BaseToast, type ToastConfig } from 'react-native-toast-message';
import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '../../themes';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.baseToast, styles.success]}
      text1Style={styles.text}
      text2Style={styles.smallText}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={[styles.baseToast, styles.error]}
      text1Style={styles.text}
      text2Style={styles.smallText}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.baseToast, styles.info]}
      text1Style={styles.text}
      text2Style={styles.smallText}
    />
  ),
};

function TarotToast() {
  return (
    <Toast
      topOffset={Platform.OS === 'web' ? 16 : 56}
      visibilityTime={3500}
      config={toastConfig}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.Content,
    fontSize: Platform.OS === 'web' ? 15 : 22,
    fontWeight: '400',
  },
  smallText: {
    fontSize: Platform.OS === 'web' ? 13 : 22,
    color: 'rgba(218, 230, 255, 0.82)',
  },
  baseToast: {
    borderLeftColor: COLORS.Primary,
    backgroundColor: COLORS.Background,
    borderColor: COLORS.Primary,
    borderLeftWidth: 2,
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? ({
          maxWidth: 420,
          width: '92%',
          alignSelf: 'center',
          zIndex: 99999,
        } as object)
      : {}),
  },
  success: {
    borderLeftColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  error: {
    borderLeftColor: COLORS.Fury,
    borderColor: COLORS.Fury,
  },
  info: {
    borderLeftColor: COLORS.Primary,
    borderColor: 'rgba(128, 174, 226, 0.5)',
  },
});

export default TarotToast;
