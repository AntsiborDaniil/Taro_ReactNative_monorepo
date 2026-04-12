import { ReactElement, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, getColorOpacity } from 'shared/themes';
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
  const opacityProgress = useSharedValue(checked ? 1 : 0);

  const animatedGradient = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacityProgress.value, { duration: 300 }),
    };
  });

  useEffect(() => {
    opacityProgress.value = withTiming(checked ? 1 : 0, { duration: 300 });
  }, [checked, opacityProgress]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1} style={styles.card}>
      <Animated.View style={[styles.gradientWrapper, animatedGradient]}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 3 }}
          colors={[
            COLORS.Background2,
            checked ? getColorOpacity(COLORS.Primary, 5) : COLORS.Background2,
          ]}
          style={styles.gradientInner}
          locations={[0.4, 1]}
        />
      </Animated.View>
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
    borderColor: COLORS.Content,
    borderWidth: 1,
    position: 'relative',
  },
  gradientWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  inner: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  gradientInner: {
    borderRadius: 16,
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.Primary,
  },
  badgeText: {
    color: COLORS.Background,
    fontWeight: 'semibold',
    fontSize: 22,
  },
  texts: {
    justifyContent: 'space-between',
    gap: 12,
  },
});

export default RadioCard;
