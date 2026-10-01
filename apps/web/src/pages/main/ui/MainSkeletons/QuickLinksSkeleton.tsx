import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'shared/ui';
import { DS_COLORS, DS_SIZES, DS_SPACE, dsRadius } from 'shared/themes/ds';

/**
 * Fallback DeferredMount на web: повторяет форму строк быстрых ссылок
 * (h 64, r 18 — «Строка списка» DS §11), чтобы при подмене на контент не
 * было прыжка. Строки всегда стопкой на всю ширину — как настоящий MainQuickLinks.
 */
export function QuickLinksSkeleton() {
  return (
    <View
      style={styles.list}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Skeleton
        height={DS_SIZES.listRowHeight}
        borderRadius={dsRadius.listRow}
        style={[
          styles.plate,
          { backgroundColor: DS_COLORS.ground700, borderColor: DS_COLORS.ground600 },
        ]}
      />
      <Skeleton
        height={DS_SIZES.listRowHeight}
        borderRadius={dsRadius.listRow}
        style={[
          styles.plate,
          { backgroundColor: DS_COLORS.ground700, borderColor: DS_COLORS.ground600 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: DS_SPACE.s,
  },
  plate: {
    width: '100%',
    borderWidth: 1,
  },
});
