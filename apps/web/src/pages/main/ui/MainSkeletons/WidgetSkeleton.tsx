import { StyleSheet } from 'react-native';
import { Skeleton } from 'shared/ui';
import { DS_COLORS, dsRadius } from 'shared/themes/ds';

type WidgetSkeletonProps = {
  /** Настроение выше привычек — плашка повыше. */
  tall?: boolean;
};

/**
 * Fallback DeferredMount на web для виджетов «Привычки» / «Настроение»:
 * одна плашка нужной высоты, без внешней рамки-карточки.
 */
export function WidgetSkeleton({ tall = false }: WidgetSkeletonProps) {
  const height = tall ? 160 : 120;

  return (
    <Skeleton
      height={height}
      borderRadius={dsRadius.plate(height)}
      style={[
        styles.plate,
        { backgroundColor: DS_COLORS.ground700, borderColor: DS_COLORS.ground600 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  plate: {
    width: '100%',
    borderWidth: 1,
  },
});
