import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Skeleton } from 'shared/ui';
import { DS_COLORS, DS_SIZES, DS_SPACE, dsRadius, getDsViewport } from 'shared/themes/ds';
import { SPREAD_CARD_WIDTH } from 'pages/main/lib/dsExtra';

/** Высота реальной строки заголовка секции (DS §11 minTouch) — чтобы скелет не прыгал при подмене. */
const HEADER_HEIGHT = DS_SIZES.minTouch;

/**
 * Fallback DeferredMount на web для «Популярные расклады»: заголовок + 3
 * тайла (изображение 1:1 + две строки текста), той же ширины, что и
 * реальные карточки.
 */
export function SpreadsSkeleton() {
  const { width } = useWindowDimensions();
  const viewport = getDsViewport(width);
  const cardWidth = SPREAD_CARD_WIDTH[viewport];
  const imageRadius = dsRadius.window(cardWidth);
  const baseStyle = {
    backgroundColor: DS_COLORS.ground700,
    borderColor: DS_COLORS.ground600,
  };

  return (
    <View
      style={styles.container}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Skeleton
        width={160}
        height={HEADER_HEIGHT}
        borderRadius={8}
        style={[styles.hairlineBorder, baseStyle]}
      />
      <View style={styles.row}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={{ width: cardWidth, gap: DS_SPACE.s }}>
            <Skeleton
              width={cardWidth}
              height={cardWidth}
              borderRadius={imageRadius}
              style={[styles.hairlineBorder, baseStyle]}
            />
            <Skeleton
              width="90%"
              height={16}
              borderRadius={4}
              style={[styles.hairlineBorder, baseStyle]}
            />
            <Skeleton
              width="55%"
              height={12}
              borderRadius={4}
              style={[styles.hairlineBorder, baseStyle]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: DS_SPACE.m,
  },
  row: {
    flexDirection: 'row',
    gap: DS_SPACE.m,
  },
  hairlineBorder: {
    borderWidth: 1,
  },
});
