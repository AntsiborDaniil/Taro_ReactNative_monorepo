import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TThematicLoveProps = TCardSchemeProps;

function ThematicLove({ onLayout, style }: TThematicLoveProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TarotSchemeCard content={2} onLayout={onLayout?.(1)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
        <TarotSchemeCard content={4} onLayout={onLayout?.(3)} />
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={5} onLayout={onLayout?.(4)} />
        <TarotSchemeCard content={6} onLayout={onLayout?.(5)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 24,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});

export default ThematicLove;
