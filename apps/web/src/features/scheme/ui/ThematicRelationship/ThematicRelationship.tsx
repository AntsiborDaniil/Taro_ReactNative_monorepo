import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TCardSchemeProps } from '../../model';
import { TarotSchemeCard } from '../TarotSchemeCard';

type TThematicRelationshipProps = TCardSchemeProps;

function ThematicRelationship({ onLayout, style }: TThematicRelationshipProps) {
  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.container}>
            <TarotSchemeCard
              content={2 * index + 1}
              onLayout={onLayout?.(2 * index)}
            />
          </View>
          <View style={styles.container}>
            <TarotSchemeCard
              content={2 * index + 2}
              onLayout={onLayout?.(2 * index + 1)}
            />
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 24,
    flexDirection: 'column-reverse',
  },
  row: {
    flexDirection: 'row',
  },
  container: {
    alignItems: 'center',
    width: '50%',
  },
});

export default ThematicRelationship;
