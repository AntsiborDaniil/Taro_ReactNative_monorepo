import Toast, { BaseToast, type ToastConfig } from 'react-native-toast-message';
import { Platform, StyleSheet } from 'react-native';
import { DS_COLORS } from '../../themes/ds';

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

/** DS: лист ground700, рамка ground600. */
const styles = StyleSheet.create({
  text: {
    color: DS_COLORS.ink50,
    fontSize: Platform.OS === 'web' ? 15 : 22,
  },
  smallText: {
    fontSize: Platform.OS === 'web' ? 13 : 22,
    color: DS_COLORS.ink100,
  },
  baseToast: {
    borderLeftColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    borderColor: DS_COLORS.ground600,
    borderLeftWidth: 2,
    borderWidth: 1,
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
    borderLeftColor: DS_COLORS.accent400,
  },
  error: {
    borderLeftColor: DS_COLORS.alarm600,
  },
  info: {
    borderLeftColor: DS_COLORS.calm500,
  },
});

export default TarotToast;
