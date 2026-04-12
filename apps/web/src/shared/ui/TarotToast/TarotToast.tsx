import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '../../themes';

function TarotToast() {
  if (Platform.OS === 'web') {
    return null;
  }

  const { default: Toast, BaseToast } = require('react-native-toast-message');
  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.baseToast, styles.success]}
        text1Style={styles.text}
        text2Style={styles.smallText}
      />
    ),
    error: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.baseToast, styles.error]}
        text1Style={styles.text}
        text2Style={styles.smallText}
      />
    ),
  };

  return <Toast topOffset={56} visibilityTime={2500} config={toastConfig} />;
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.Content,
    fontSize: 22,
    fontWeight: '400',
  },
  smallText: {
    fontSize: 22,
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
