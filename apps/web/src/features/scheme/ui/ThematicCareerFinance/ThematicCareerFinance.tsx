import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TThematicCareerFinanceProps = TCardSchemeProps;

function ThematicCareerFinance({
  onLayout,
  style,
}: TThematicCareerFinanceProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={[styles.row, styles.spaceBetween]}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
        <TarotSchemeCard content={9} onLayout={onLayout?.(8)} />
        <TarotSchemeCard content={4} onLayout={onLayout?.(3)} />
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
      <View style={[styles.row, styles.spaceBetween]}>
        <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.card}
          content={7}
          onLayout={onLayout?.(6)}
        />
        <TarotSchemeCard
          style={styles.card}
          content={8}
          onLayout={onLayout?.(7)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  card: {
    margin: 'auto',
  },
});

export default ThematicCareerFinance;
