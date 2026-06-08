import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useData } from 'shared/DataProvider';
import { SchemeContext, TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalHorseshoeProps = TCardSchemeProps;

function UniversalHorseshoe({ onLayout, style }: TUniversalHorseshoeProps) {
  const { gapScale = 1 } = useData({ Context: SchemeContext });
  const gap = Math.max(8, Math.round(16 * gapScale));
  const sideInset = Math.max(0, Math.round(48 * gapScale));

  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={[styles.row, { gap, marginHorizontal: sideInset }]}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
      </View>
      <View style={[styles.row, { gap }]}>
        <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
      </View>
      <View style={[styles.row, { gap, marginHorizontal: sideInset }]}>
        <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
        <TarotSchemeCard
          style={[styles.bottomCard, { marginTop: Math.round(32 * gapScale) }]}
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
    alignSelf: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomCard: {},
});

export default UniversalHorseshoe;
