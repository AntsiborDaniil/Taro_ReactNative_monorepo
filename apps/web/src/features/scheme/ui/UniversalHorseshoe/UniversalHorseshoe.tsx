import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalHorseshoeProps = TCardSchemeProps;

function UniversalHorseshoe({ onLayout, style }: TUniversalHorseshoeProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={[styles.row, styles.marginRow]}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
      </View>
      <View style={[styles.row, styles.marginRow]}>
        <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
        <TarotSchemeCard
          style={styles.bottomCard}
          content={4}
          onLayout={onLayout?.(3)}
        />
        <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
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
    gap: 16,
    justifyContent: 'space-between',
  },
  bottomCard: {
    marginTop: 32,
  },
  marginRow: {
    marginLeft: 48,
    marginRight: 48,
  },
});

export default UniversalHorseshoe;
