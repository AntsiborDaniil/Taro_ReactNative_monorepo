import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TSelfDevelopmentMirrorProps = TCardSchemeProps;

function SelfDevelopmentMirror({
  onLayout,
  style,
}: TSelfDevelopmentMirrorProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <View style={styles.column}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={index}
              content={index + 1}
              onLayout={onLayout?.(index)}
            />
          ))}
        </View>
        <View style={[styles.column, styles.center]}>
          {[...Array(2)].map((_, index) => (
            <TarotSchemeCard
              key={index + 8}
              content={index + 9}
              onLayout={onLayout?.(index + 8)}
            />
          ))}
        </View>
        <View style={styles.column}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={index + 3}
              content={index + 4}
              onLayout={onLayout?.(index + 3)}
            />
          ))}
        </View>
      </View>
      <View style={styles.row}>
        <TarotSchemeCard content={8} onLayout={onLayout?.(7)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
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
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
  },
  column: {
    gap: 24,
    flexDirection: 'column-reverse',
  },
  center: {
    justifyContent: 'center',
  },
});

export default SelfDevelopmentMirror;
