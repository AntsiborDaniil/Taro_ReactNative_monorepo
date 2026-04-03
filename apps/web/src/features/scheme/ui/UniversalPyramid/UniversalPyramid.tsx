import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TUniversalPyramidProps = TCardSchemeProps;

function UniversalPyramid({ onLayout, style }: TUniversalPyramidProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TarotSchemeCard content={1} onLayout={onLayout?.(0)} />
      </View>
      <View style={styles.row}>
        {[...Array(2)].map((_, index) => (
          <TarotSchemeCard
            key={index + 1}
            content={index + 2}
            onLayout={onLayout?.(index + 1)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {[...Array(3)].map((_, index) => (
          <TarotSchemeCard
            key={index + 3}
            content={index + 4}
            onLayout={onLayout?.(index + 3)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {[...Array(4)].map((_, index) => (
          <TarotSchemeCard
            key={index + 6}
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
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
});

export default UniversalPyramid;
