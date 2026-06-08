import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';

type SpreadStepperProps = {
  /** 1 = prepare, 2 = choose, 3 = read */
  activeStep: 1 | 2 | 3;
};

const STEPS = ['spread:flow.step.prepare', 'spread:flow.step.choose', 'spread:flow.step.read'] as const;

function SpreadStepper({ activeStep }: SpreadStepperProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      {STEPS.map((key, index) => {
        const step = (index + 1) as 1 | 2 | 3;
        const isActive = step === activeStep;
        const isDone = step < activeStep;

        return (
          <View key={key} style={styles.step}>
            <View
              style={[
                styles.dot,
                isDone && styles.dotDone,
                isActive && styles.dotActive,
              ]}
            />
            <Text
              category={TEXT_TAGS.label}
              style={[
                styles.label,
                isActive && styles.labelActive,
                isDone && styles.labelDone,
              ]}
              numberOfLines={1}
            >
              {t(key)}
            </Text>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.connector,
                  (isDone || isActive) && styles.connectorActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: getColorOpacity(COLORS.SpbSky1, 35),
    marginBottom: 6,
  },
  dotActive: {
    backgroundColor: COLORS.Primary,
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: getColorOpacity(COLORS.Primary, 70),
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 45),
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.Primary,
    fontWeight: '600',
  },
  labelDone: {
    color: getColorOpacity(COLORS.Content, 65),
  },
  connector: {
    position: 'absolute',
    top: 4,
    left: '58%',
    right: '-42%',
    height: 2,
    backgroundColor: getColorOpacity(COLORS.SpbSky1, 22),
    zIndex: -1,
  },
  connectorActive: {
    backgroundColor: getColorOpacity(COLORS.Primary, 45),
  },
});

export default SpreadStepper;
