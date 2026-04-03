import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TChoicePerspectiveProps = TCardSchemeProps;

function ChoicePerspective({ onLayout, style }: TChoicePerspectiveProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.card}
          content={2}
          onLayout={onLayout?.(1)}
        />
        <TarotSchemeCard
          style={styles.card}
          content={3}
          onLayout={onLayout?.(2)}
        />
      </View>
      <View style={[styles.row, styles.center]}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.card}
          content={4}
          onLayout={onLayout?.(3)}
        />
        <TarotSchemeCard
          style={styles.card}
          content={5}
          onLayout={onLayout?.(4)}
        />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={8} onLayout={onLayout?.(7)} />
        <TarotSchemeCard content={9} onLayout={onLayout?.(8)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 8,
  },
  row: {
    gap: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
  },
  card: {
    margin: 'auto',
  },
});

export default ChoicePerspective;
