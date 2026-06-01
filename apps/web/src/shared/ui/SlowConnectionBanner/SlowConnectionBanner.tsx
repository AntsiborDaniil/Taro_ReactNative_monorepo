import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSlowConnection } from 'shared/lib/web/useSlowConnection';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS } from '../Text';

export function SlowConnectionBanner() {
  const { t } = useTranslation('core');
  const isSlow = useSlowConnection();

  if (Platform.OS !== 'web' || !isSlow) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="status">
      <Text category={TEXT_TAGS.label} style={styles.text}>
        {t('slowConnection.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: getColorOpacity(COLORS.Accent, 220),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: getColorOpacity(COLORS.Content, 40),
  },
  text: {
    textAlign: 'center',
    color: COLORS.Content,
  },
});
