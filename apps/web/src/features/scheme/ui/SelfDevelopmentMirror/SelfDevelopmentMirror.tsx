import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useData } from 'shared/DataProvider';
import { SchemeContext, TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TSelfDevelopmentMirrorProps = TCardSchemeProps;

function SelfDevelopmentMirror({
  onLayout,
  style,
}: TSelfDevelopmentMirrorProps) {
  const { gapScale = 1 } = useData({ Context: SchemeContext });
  const rowGap = Math.max(8, Math.round(32 * gapScale));
  const colGap = Math.max(8, Math.round(24 * gapScale));

  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      <View style={[styles.row, { gap: rowGap }]}>
        <View style={[styles.column, { gap: colGap }]}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={index}
              content={index + 1}
              onLayout={onLayout?.(index)}
            />
          ))}
        </View>
        <View style={[styles.column, styles.center, { gap: colGap }]}>
          {[...Array(2)].map((_, index) => (
            <TarotSchemeCard
              key={index + 8}
              content={index + 9}
              onLayout={onLayout?.(index + 8)}
            />
          ))}
        </View>
        <View style={[styles.column, { gap: colGap }]}>
          {[...Array(3)].map((_, index) => (
            <TarotSchemeCard
              key={index + 3}
              content={index + 4}
              onLayout={onLayout?.(index + 3)}
            />
          ))}
        </View>
      </View>
      <View style={[styles.row, { gap: rowGap }]}>
        <TarotSchemeCard content={8} onLayout={onLayout?.(7)} />
        <TarotSchemeCard content={7} onLayout={onLayout?.(6)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column-reverse',
  },
  center: {
    justifyContent: 'center',
  },
});

export default SelfDevelopmentMirror;
