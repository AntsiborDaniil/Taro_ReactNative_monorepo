import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DS_COLORS,
  DS_MOTION,
  DS_SIZES,
  DS_SPACE,
  dsFocusRing,
  dsRadius,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
} from 'shared/themes/ds';
import { useKeyboardFocusVisible } from '../lib/useKeyboardFocusVisible';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';

type SpreadsEmptyStateProps = {
  title: string;
  actionLabel: string;
  onAction: () => void;
};

/** DS §11 «Пустое состояние»: пунктирная оправа + заголовок + действие. Практически недостижимо
 *  (каталог собирается из статических данных), но требуется чек-листом приёмки как защитный кейс. */
function SpreadsEmptyState({ title, actionLabel, onAction }: SpreadsEmptyStateProps) {
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();
  const reducedMotion = usePrefersReducedMotion();
  const webTransition = reducedMotion ? dsWebTransitionReduced : dsWebTransition;

  return (
    <View style={styles.frame}>
      <Text style={[dsText('body', DS_COLORS.ink100), styles.title]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        onFocus={onFocus}
        onBlur={onBlur}
        style={({ pressed }) => [
          styles.action,
          pressed ? { transform: [{ translateY: DS_MOTION.pressShiftY }] } : null,
          focusVisible ? dsFocusRing : null,
          webTransition,
        ]}
      >
        {({ pressed }) => (
          <>
            <Text style={dsText('label', DS_COLORS.accent400)}>{actionLabel}</Text>
            {pressed ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressOverlay]} />
            ) : null}
          </>
        )}
      </Pressable>
    </View>
  );
}

export default SpreadsEmptyState;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS_SPACE.l,
    paddingVertical: DS_SPACE.xxl,
    paddingHorizontal: DS_SPACE.xl,
    borderRadius: dsRadius.plate(160),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DS_COLORS.ground600,
  },
  title: {
    textAlign: 'center',
  },
  action: {
    // Журнал: без action-500 — на странице раскладов действие не «единственное» (DS §05).
    height: DS_SIZES.chipHeight,
    minWidth: 200,
    borderRadius: dsRadius.capsule(DS_SIZES.chipHeight),
    backgroundColor: DS_COLORS.ground700,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS_SPACE.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  pressOverlay: {
    backgroundColor: DS_COLORS.pressDim,
  },
});
