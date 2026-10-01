import { ReactElement, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DS_COLORS, DS_MOTION } from 'shared/themes/ds';
import { Radio } from '../Radio';
import { Text, TEXT_TAGS } from '../Text';

export type RadioCardProps = {
  checked?: boolean;
  title?: string;
  subtitle?: string;
  badgeContent?: string;
  onPress?: () => void;
};

function RadioCard({
  checked,
  onPress,
  subtitle,
  badgeContent,
  title,
}: RadioCardProps): ReactElement {
  const fillProgress = useSharedValue(checked ? 1 : 0);

  const animatedFill = useAnimatedStyle(() => {
    return {
      opacity: withTiming(fillProgress.value, { duration: DS_MOTION.state }),
    };
  });

  useEffect(() => {
    fillProgress.value = withTiming(checked ? 1 : 0, { duration: DS_MOTION.state });
  }, [checked, fillProgress]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={[styles.card, checked && styles.cardChecked]}
    >
      <Animated.View style={[styles.fill, animatedFill]} />
      <View style={styles.inner}>
        <Radio checked={checked} />
        <View style={styles.texts}>
          {title && <Text category={TEXT_TAGS.h3}>{title}</Text>}
          {subtitle && <Text category={TEXT_TAGS.label}>{subtitle}</Text>}
        </View>
      </View>

      {badgeContent && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} category={TEXT_TAGS.label}>
            {badgeContent}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderStyle: 'solid',
    borderColor: DS_COLORS.ground600,
    borderWidth: 1,
    backgroundColor: DS_COLORS.ground700,
    position: 'relative',
    overflow: 'hidden',
  },
  cardChecked: {
    borderColor: DS_COLORS.accent400,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DS_COLORS.ground600,
  },
  inner: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: DS_COLORS.accent400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
  },
  badgeText: {
    color: DS_COLORS.onAction,
    fontSize: 22,
  },
  texts: {
    justifyContent: 'space-between',
    gap: 12,
  },
});

export default RadioCard;
