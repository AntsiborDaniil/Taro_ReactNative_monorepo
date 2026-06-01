import { StyleSheet, View } from 'react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Skeleton, SkeletonRow } from './Skeleton';

type PageSkeletonProps = {
  withHeader?: boolean;
  blocks?: number;
};

export function PageSkeleton({
  withHeader = true,
  blocks = 4,
}: PageSkeletonProps) {
  return (
    <ScreenLayout style={styles.layout}>
      {withHeader ? (
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="55%" height={22} borderRadius={8} />
        </View>
      ) : null}
      <View style={styles.body}>
        {Array.from({ length: blocks }).map((_, index) => (
          <SkeletonRow key={index} gap={10}>
            <Skeleton height={index === 0 ? 120 : 72} borderRadius={16} />
            {index < 2 ? (
              <>
                <Skeleton width="80%" height={14} />
                <Skeleton width="45%" height={12} />
              </>
            ) : null}
          </SkeletonRow>
        ))}
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
    paddingBottom: 16,
  },
  body: {
    paddingHorizontal: 16,
    gap: 20,
    paddingBottom: 48,
  },
});
