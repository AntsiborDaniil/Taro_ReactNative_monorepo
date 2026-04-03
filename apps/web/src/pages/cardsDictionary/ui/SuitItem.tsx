import React, { ReactElement, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TarotCardArcana, TarotCardSuit } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { isTablet } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
import { TSuitItem } from '../lib/constants';

export type SuitItemProps = {
  setSelectedSuitOrArcana: (value: TarotCardSuit | TarotCardArcana) => void;
  selectedSuitOrArcana: TarotCardArcana | TarotCardSuit;
  suitItem: TSuitItem;
};

function SuitItem({
  suitItem,
  selectedSuitOrArcana,
  setSelectedSuitOrArcana,
}: SuitItemProps): ReactElement {
  const { Icon, id, suitOrArcana } = suitItem;

  const checked = selectedSuitOrArcana === suitOrArcana;

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const opacityProgress = useSharedValue(checked ? 1 : 0);

  const animatedGradient = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacityProgress.value, { duration: 100 }),
    };
  });

  useEffect(() => {
    opacityProgress.value = withTiming(checked ? 1 : 0, { duration: 100 });
  }, [checked, opacityProgress]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={async () => {
        await handleVibrationClick?.();

        setSelectedSuitOrArcana(suitOrArcana);
      }}
      key={id}
      style={styles.item}
    >
      <Animated.View style={[styles.gradientWrapper, animatedGradient]}>
        <LinearGradient
          colors={[
            getColorOpacity(COLORS.SpbSky1, 0),
            getColorOpacity(COLORS.Primary, 10),
          ]}
          style={styles.gradientInner}
          locations={[0.2, 0.9]}
        />
      </Animated.View>

      <Icon
        width={isTablet ? 60 : 40}
        height={isTablet ? 60 : 40}
        fill={checked ? COLORS.Primary : COLORS.Content}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientInner: {
    borderRadius: 14,
    width: '100%',
    height: '100%',
  },
  item: {
    width: isTablet ? 68 : 58,
    height: isTablet ? 68 : 58,
    backgroundColor: getColorOpacity(COLORS.SpbSky1, 30),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    position: 'relative',
  },
});

export default SuitItem;
