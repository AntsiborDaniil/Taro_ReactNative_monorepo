import { StyleSheet } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';
import Toast, { BaseToast } from 'react-native-toast-message';
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
};

function TarotToast() {
  return <Toast topOffset={56} visibilityTime={2500} config={toastConfig} />;
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.Content,
    fontSize: 15,
    fontWeight: '400',
  },
  smallText: {
    fontSize: 15,
  },
  baseToast: {
    borderLeftColor: COLORS.Primary,
    backgroundColor: COLORS.Background,
    borderColor: COLORS.Primary,
    borderLeftWidth: 2,
    borderWidth: 2,
  },
  success: {
    borderLeftColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  error: {
    borderLeftColor: COLORS.Fury,
    borderColor: COLORS.Fury,
  },
});

export default TarotToast;
