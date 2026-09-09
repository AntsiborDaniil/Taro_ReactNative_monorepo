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
    paddingHorizontal: 10,
    paddingVertical: 14,
    gap: 4,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 12),
    backgroundColor: 'rgba(22, 28, 38, 0.45)',
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
    backgroundColor: getColorOpacity(COLORS.SpbSky1, 30),
    marginBottom: 7,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Content, 12),
  },
  dotActive: {
    backgroundColor: COLORS.Primary500,
    borderColor: COLORS.Primary200,
    transform: [{ scale: 1.2 }],
    ...({
      boxShadow: '0 0 12px rgba(246, 192, 27, 0.45)',
    } as object),
  },
  dotDone: {
    backgroundColor: getColorOpacity(COLORS.Primary500, 75),
    borderColor: getColorOpacity(COLORS.Primary300, 50),
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 45),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: COLORS.Primary300,
    fontWeight: '600',
  },
  labelDone: {
    color: getColorOpacity(COLORS.Content, 68),
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
    backgroundColor: getColorOpacity(COLORS.Primary500, 55),
  },
});

export default SpreadStepper;
