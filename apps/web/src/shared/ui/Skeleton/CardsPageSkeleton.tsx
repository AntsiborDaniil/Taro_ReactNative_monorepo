import { StyleSheet, View } from 'react-native';
import { ScreenLayout } from '../ScreenLayout';
import { CardsGridSkeleton } from './CardsGridSkeleton';
import { Skeleton } from './Skeleton';

type CardsPageSkeletonProps = {
  /** Словарь карт: полоска чипов мастей над сеткой */
  withSuitChips?: boolean;
};

/**
 * Заглушка экранов «Избранное» и «Значения карт» — внутри ScreenLayout, как у живой страницы.
 */
export function CardsPageSkeleton({
  withSuitChips = false,
}: CardsPageSkeletonProps) {
  return (
    <ScreenLayout style={styles.layout}>
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="52%" height={22} borderRadius={8} />
      </View>
      {withSuitChips ? (
        <View style={styles.chipsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === 0 ? 72 : 64}
              height={36}
              borderRadius={18}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.gridWrap}>
        <CardsGridSkeleton />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  gridWrap: {
    flex: 1,
    width: '100%',
  },
});
