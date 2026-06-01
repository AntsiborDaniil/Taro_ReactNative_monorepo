import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export function MainSectionSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <View style={styles.shell}>
      <Skeleton height={tall ? 160 : 100} borderRadius={20} />
      <View style={styles.row}>
        <Skeleton width="70%" height={14} />
        <Skeleton width={64} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 12,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
