import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useData } from 'shared/DataProvider';
import { SchemeContext, TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalFlameProps = TCardSchemeProps;

function UniversalFlame({ onLayout, style }: TUniversalFlameProps) {
  const { gapScale = 1 } = useData({ Context: SchemeContext });
  const gap = Math.max(10, Math.round(48 * gapScale));
  const wingOffset = Math.max(6, Math.round(25 * gapScale));

  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={[styles.row, { gap }]}>
        <TarotSchemeCard
          style={{ transform: [{ translateX: wingOffset }, { rotate: '-25deg' }] }}
          content={10}
          onLayout={onLayout?.(9)}
        />
        <TarotSchemeCard content={12} onLayout={onLayout?.(11)} />
        <TarotSchemeCard
          style={{ transform: [{ translateX: -wingOffset }, { rotate: '25deg' }] }}
          content={11}
          onLayout={onLayout?.(10)}
        />
      </View>
      <View style={[styles.row, { gap }]}>
        <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
        <TarotSchemeCard content={9} onLayout={onLayout?.(8)} />
      </View>
      <View style={[styles.row, { gap }]}>
        <TarotSchemeCard
          style={{ transform: [{ translateX: wingOffset }, { rotate: '-25deg' }] }}
          content={4}
          onLayout={onLayout?.(3)}
        />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
        <TarotSchemeCard
          style={{ transform: [{ translateX: -wingOffset }, { rotate: '25deg' }] }}
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
    alignSelf: 'center',
    gap: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default UniversalFlame;
