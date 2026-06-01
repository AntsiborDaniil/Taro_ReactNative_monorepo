import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { COLORS } from 'shared/themes';
import { Skeleton } from './Skeleton';

export function CardsGridSkeleton({ columns = 3 }: { columns?: number }) {
  const { width } = useWindowDimensions();
  const gap = 12;
  const horizontalPad = 32;
  const cardWidth = Math.floor(
    (width - horizontalPad - gap * (columns - 1)) / columns
  );
  const cardHeight = Math.round(cardWidth * 1.55);

  return (
    <View style={styles.grid}>
      {Array.from({ length: columns * 2 }).map((_, i) => (
        <Skeleton
          key={i}
          width={cardWidth}
          height={cardHeight}
          borderRadius={12}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 48,
    justifyContent: 'center',
    backgroundColor: COLORS.Background,
  },
});
