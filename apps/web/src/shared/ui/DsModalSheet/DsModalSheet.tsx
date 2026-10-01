import { type ReactNode, useCallback } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS_BREAKPOINTS, DS_COLORS, dsRadius } from 'shared/themes/ds';

type DsModalSheetProps = {
  children: ReactNode;
  onClose: () => void;
  closeAccessibilityLabel: string;
  /** Макс. ширина листа на ≥768. По умолчанию 480 (DS §правила модалок). */
  maxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Общий DS-лист для модалок (скрим ground900 ~80%, лист ground800, радиус «лист»).
 * <768 — bottom sheet во всю ширину, прижат к низу, верхние углы скруглены.
 * ≥768 — центрированный лист, максимум `maxWidth`, скруглён со всех сторон.
 */
function DsModalSheet({
  children,
  onClose,
  closeAccessibilityLabel,
  maxWidth = 480,
  contentStyle,
}: DsModalSheetProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < DS_BREAKPOINTS.tablet;
  const sheetRadius = dsRadius.sheet(width);

  const stopPropagation = useCallback(
    (event?: { stopPropagation?: () => void }) => {
      event?.stopPropagation?.();
    },
    []
  );

  return (
    <View
      style={[
        styles.root,
        isMobile ? styles.rootMobile : styles.rootDesktop,
        {
          paddingTop: isMobile ? 0 : insets.top + 12,
          paddingBottom: isMobile ? 0 : insets.bottom + 12,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeAccessibilityLabel}
        style={styles.backdrop}
        onPress={onClose}
      />
      <Pressable
        accessible={false}
        style={[
          styles.sheet,
          isMobile
            ? {
                width: '100%',
                borderTopLeftRadius: sheetRadius,
                borderTopRightRadius: sheetRadius,
                paddingBottom: insets.bottom + 12,
              }
            : {
                width: '100%',
                maxWidth,
                borderRadius: sheetRadius,
              },
          contentStyle,
        ]}
        onPress={stopPropagation}
        // RN Web: prevent click-through to backdrop (closes modal on inner taps).
        {...(Platform.OS === 'web'
          ? ({ onClick: stopPropagation } as object)
          : null)}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rootDesktop: {
    justifyContent: 'center',
  },
  rootMobile: {
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${DS_COLORS.ground900}CC`,
  },
  sheet: {
    zIndex: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
});

export default DsModalSheet;
