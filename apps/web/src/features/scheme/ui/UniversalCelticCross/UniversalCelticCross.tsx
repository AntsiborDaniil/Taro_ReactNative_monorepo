import { StyleSheet, View } from 'react-native';
import { SchemeContext, TCardSchemeProps } from '../../model';
import { useData } from 'shared/DataProvider';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalCelticCrossProps = TCardSchemeProps;

function UniversalCelticCross({ onLayout, style }: TUniversalCelticCrossProps) {
  const { cardSize } = useData({ Context: SchemeContext });

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.cross}>
        <View style={styles.row}>
          <TarotSchemeCard content={4} onLayout={onLayout?.(3)} />
        </View>
        <View style={[styles.row, styles.middleRow]}>
          <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
          <View
            style={[
              styles.center,
              cardSize
                ? { width: cardSize.width, height: cardSize.height }
                : null,
            ]}
          >
            <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
            <TarotSchemeCard
              isHorizontal
              style={[
                styles.horizontal,
                cardSize
                  ? { width: cardSize.width, height: cardSize.height }
                  : null,
              ]}
              content="1 + 2"
              onLayout={onLayout?.(0)}
            />
          </View>
          <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
        </View>
        <View style={styles.row}>
          <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
        </View>
      </View>
      <View style={styles.column}>
        {[...Array(4)].map((_, index) => (
          <TarotSchemeCard
            key={index}
            content={index + 7}
            onLayout={onLayout?.(index + 6)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRow: {
    marginBottom: 12,
  },
  center: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  cross: {
    flex: 3,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexDirection: 'column-reverse',
  },
});

export default UniversalCelticCross;
