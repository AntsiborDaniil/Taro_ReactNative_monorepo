import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TSelfDevelopmentPerspectiveProps = TCardSchemeProps;

function SelfDevelopmentPerspective({
  onLayout,
  style,
}: TSelfDevelopmentPerspectiveProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TarotSchemeCard
          style={styles.card}
          content={1}
          onLayout={onLayout?.(0)}
        />
        <TarotSchemeCard
          style={styles.card}
          content={2}
          onLayout={onLayout?.(1)}
        />
      </View>
      <View style={[styles.row, styles.center]}>
        <TarotSchemeCard content={3} onLayout={onLayout?.(2)} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 16,
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

export default SelfDevelopmentPerspective;
