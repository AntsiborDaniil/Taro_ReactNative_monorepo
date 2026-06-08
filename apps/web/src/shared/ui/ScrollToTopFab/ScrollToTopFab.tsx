import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';

type ScrollToTopFabProps = {
  visible: boolean;
  onPress: () => void;
  bottomOffset?: number;
};

function ScrollToTopFab({
  visible,
  onPress,
  bottomOffset = 20,
}: ScrollToTopFabProps) {
  const { bottom, right } = useSafeAreaInsets();
  const { t } = useTranslation('core');

  return (
    <View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.host,
        {
          bottom: bottom + bottomOffset,
          right: Math.max(16, right + 12),
          opacity: visible ? 1 : 0,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.scrollToTop')}
        accessibilityState={{ disabled: !visible }}
        disabled={!visible}
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <UpIcon width={22} height={22} />
      </Pressable>
    </View>
  );
}

const FAB_SIZE = 48;

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    zIndex: 40,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 22px rgba(246, 192, 27, 0.42)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: COLORS.Primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  fabPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});

export default ScrollToTopFab;
