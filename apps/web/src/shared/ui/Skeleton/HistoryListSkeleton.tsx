import { StyleSheet, View } from 'react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Skeleton } from './Skeleton';

export function HistoryListSkeleton() {
  return (
    <ScreenLayout style={styles.layout}>
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={22} borderRadius={8} />
      </View>
      <View style={styles.list}>
        <Skeleton width={100} height={18} borderRadius={6} />
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardTop}>
              <Skeleton width="55%" height={16} />
              <Skeleton width={48} height={14} />
            </View>
            <Skeleton width="90%" height={12} />
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 48,
  },
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
