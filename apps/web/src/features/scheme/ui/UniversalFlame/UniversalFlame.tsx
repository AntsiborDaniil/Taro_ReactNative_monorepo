import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalFlameProps = TCardSchemeProps;

function UniversalFlame({ onLayout, style }: TUniversalFlameProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.left}
          content={10}
          onLayout={onLayout?.(9)}
        />
        <TarotSchemeCard content={12} onLayout={onLayout?.(11)} />
        <TarotSchemeCard
          style={styles.right}
          content={11}
          onLayout={onLayout?.(10)}
        />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
        <TarotSchemeCard content={9} onLayout={onLayout?.(8)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.left}
          content={4}
          onLayout={onLayout?.(3)}
        />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
        <TarotSchemeCard
          style={styles.right}
          content={8}
          onLayout={onLayout?.(7)}
        />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  left: {
    transform: [{ translateX: 25 }, { rotate: '-25deg' }],
  },
  right: {
    transform: [{ translateX: -25 }, { rotate: '25deg' }],
  },
});

export default UniversalFlame;
