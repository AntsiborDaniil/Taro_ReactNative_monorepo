import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TChoiceTwoPathsProps = TCardSchemeProps;

function ChoiceTwoPaths({ onLayout, style }: TChoiceTwoPathsProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.single}>
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
      </View>
      <View style={styles.rows}>
        <View style={styles.row}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={2 * index + 1}
              content={2 * index + 1}
              onLayout={onLayout?.(2 * index)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={index}
              content={2 * index + 2}
              onLayout={onLayout?.(2 * index + 1)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  rows: {
    flexDirection: 'column',
    gap: 16,
  },
  single: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
});

export default ChoiceTwoPaths;
