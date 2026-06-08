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
    alignSelf: 'center',
    gap: 16,
    flexDirection: 'column-reverse',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    alignItems: 'center',
    flex: 1,
  },
});

export default ThematicRelationship;
