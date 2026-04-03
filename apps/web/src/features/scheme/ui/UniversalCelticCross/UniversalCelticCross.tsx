import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalCelticCrossProps = TCardSchemeProps;

function UniversalCelticCross({ onLayout, style }: TUniversalCelticCrossProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.cross}>
        <View style={styles.row}>
          <TarotSchemeCard content={4} onLayout={onLayout?.(3)} />
        </View>
        <View style={styles.row}>
          <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
          <View style={styles.center}>
            <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
            <TarotSchemeCard
              isHorizontal
              style={styles.horizontal}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  center: {
    position: 'relative',
  },
  horizontal: {
    position: 'absolute',
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
