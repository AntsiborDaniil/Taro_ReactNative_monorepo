import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DS_COLORS } from 'shared/themes/ds';
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
    paddingHorizontal: 10,
    paddingVertical: 14,
    gap: 4,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minWidth: 0,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: DS_COLORS.ground700,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  dotActive: {
    backgroundColor: DS_COLORS.accent400,
    borderColor: DS_COLORS.accent400,
  },
  dotDone: {
    backgroundColor: DS_COLORS.calm500,
    borderColor: DS_COLORS.calm500,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: DS_COLORS.ink100,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: DS_COLORS.accent400,
  },
  labelDone: {
    color: DS_COLORS.ink100,
  },
  connector: {
    position: 'absolute',
    top: 4,
    left: '58%',
    right: '-42%',
    height: 2,
    backgroundColor: DS_COLORS.ground600,
    zIndex: -1,
  },
  connectorActive: {
    backgroundColor: DS_COLORS.accent400,
  },
});

export default SpreadStepper;
