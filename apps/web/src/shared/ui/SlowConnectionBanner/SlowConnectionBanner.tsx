import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrossIcon } from 'shared/icons';
import {
  dismissSlowConnectionBanner,
  isSlowConnectionBannerDismissed,
} from 'shared/lib/web/slowConnectionBannerDismiss';
import { useSlowConnection } from 'shared/lib/web/useSlowConnection';
import { COLORS } from 'shared/themes';
import { DS_COLORS } from 'shared/themes/ds';
import { Text, TEXT_TAGS } from '../Text';

export function SlowConnectionBanner() {
  const { t } = useTranslation('core');
  const isSlow = useSlowConnection();
  const [dismissed, setDismissed] = useState(isSlowConnectionBannerDismissed);

  const handleDismiss = useCallback(() => {
    dismissSlowConnectionBanner();
    setDismissed(true);
  }, []);

  if (Platform.OS !== 'web' || !isSlow || dismissed) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="status">
      <Text category={TEXT_TAGS.label} style={styles.text}>
        {t('slowConnection.hint')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('slowConnection.dismiss')}
        hitSlop={12}
        onPress={handleDismiss}
        style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
      >
        <CrossIcon width={16} height={16} fill={COLORS.Content} />
      </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 10,
    gap: 8,
    backgroundColor: COLORS.Background2,
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.ground600,
  },
  text: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.Content,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS_COLORS.ground700,
  },
  closePressed: {
    opacity: 0.85,
  },
});
