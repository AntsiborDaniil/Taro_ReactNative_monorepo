import { SafeAreaView, StyleSheet } from 'react-native';
import { ProgressBar } from '@ui-kitten/components';
import { DS_COLORS } from 'shared/themes/ds';

type ProgressLinesProps = {
  linesCount: number;
  completedLinesCount: number;
};

function ProgressLines({
  linesCount,
  completedLinesCount,
}: ProgressLinesProps) {
  return (
    <>
      <SafeAreaView style={styles.container}>
        {Array.from(Array(linesCount).keys()).map((_, i) => (
          <ProgressBar
            key={i}
            style={[styles.line]}
            animating={true}
            progress={completedLinesCount - 1 >= i ? 1 : 0}
          />

          // <SafeAreaView
          //   style={[
          //     styles.line,
          //     {
          //       backgroundColor:
          //         completedLinesCount - 1 >= i ? COLORS.Primary : COLORS.SpbSky3,
          //     },
          //   ]}
          //   key={i}
          // />
        ))}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    flexDirection: 'row',
    // flex: 1,
  },
  line: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: DS_COLORS.ground600,
  },
});

export default ProgressLines;
