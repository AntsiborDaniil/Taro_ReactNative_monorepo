import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { COLORS, getColorOpacity } from 'shared/themes';

const STARS = [
  { top: '8%', left: '12%', size: 2, opacity: 0.55 },
  { top: '14%', left: '78%', size: 1.5, opacity: 0.4 },
  { top: '22%', left: '42%', size: 2, opacity: 0.35 },
  { top: '31%', left: '88%', size: 1.5, opacity: 0.5 },
  { top: '38%', left: '18%', size: 1, opacity: 0.3 },
  { top: '48%', left: '64%', size: 2, opacity: 0.45 },
  { top: '56%', left: '8%', size: 1.5, opacity: 0.35 },
  { top: '67%', left: '52%', size: 1, opacity: 0.28 },
  { top: '74%', left: '86%', size: 2, opacity: 0.4 },
  { top: '82%', left: '28%', size: 1.5, opacity: 0.32 },
  { top: '18%', left: '58%', size: 1, opacity: 0.25 },
  { top: '61%', left: '71%', size: 1.5, opacity: 0.38 },
] as const;

type FantasyAtmosphereProps = {
  compact?: boolean;
  wide?: boolean;
};

/**
 * Shared epic-fantasy / tarot chrome: warm gold aurora, midnight vignette, stars.
 * Non-interactive; safe under any ScreenLayout.
 */
export function FantasyAtmosphere({
  compact = false,
  wide = false,
}: FantasyAtmosphereProps) {
  const { width } = useWindowDimensions();
  const isCompact = compact || width < 760;
  const isWide = wide || width > 1280;

  const topOrb = isCompact ? 220 : isWide ? 340 : 280;
  const bottomOrb = isCompact ? 180 : isWide ? 300 : 240;
  const midOrb = isCompact ? 120 : 160;

  return (
    <View pointerEvents="none" style={styles.root}>
      <View
        style={[
          styles.wash,
          Platform.OS === 'web' ? styles.washWeb : null,
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbGold,
          {
            width: topOrb,
            height: topOrb,
            top: -Math.round(topOrb * 0.52),
            right: -Math.round(topOrb * 0.3),
          },
          Platform.OS === 'web' ? styles.orbPulseA : null,
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbTeal,
          {
            width: bottomOrb,
            height: bottomOrb,
            left: -Math.round(bottomOrb * 0.4),
            bottom: -Math.round(bottomOrb * 0.48),
          },
          Platform.OS === 'web' ? styles.orbPulseB : null,
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbAmber,
          {
            width: midOrb,
            height: midOrb,
            top: isCompact ? '42%' : '38%',
            left: isCompact ? '62%' : '70%',
          },
        ]}
      />
      {STARS.map((star, index) => (
        <View
          key={`star-${index}`}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              borderRadius: star.size,
            },
            Platform.OS === 'web' && index % 3 === 0
              ? styles.starTwinkle
              : null,
          ]}
        />
      ))}
      <View style={styles.vignette} />
      {!isCompact ? (
        <View
          style={[
            styles.cornerSigil,
            {
              right: isWide ? 36 : 24,
              bottom: isWide ? 40 : 28,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: getColorOpacity(COLORS.Primary500, 4),
  },
  washWeb: {
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: [
            'radial-gradient(ellipse 90% 55% at 50% -15%, rgba(246, 192, 27, 0.14), transparent 58%)',
            'radial-gradient(ellipse 55% 45% at 100% 8%, rgba(47, 186, 216, 0.1), transparent 52%)',
            'radial-gradient(ellipse 60% 50% at 0% 100%, rgba(100, 152, 202, 0.12), transparent 55%)',
            'radial-gradient(ellipse 100% 100% at 50% 60%, transparent 42%, rgba(8, 12, 20, 0.5) 100%)',
          ].join(', '),
        } as object)
      : {}),
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbGold: {
    backgroundColor: 'rgba(246, 192, 27, 0.14)',
  },
  orbTeal: {
    backgroundColor: 'rgba(47, 186, 216, 0.1)',
  },
  orbAmber: {
    backgroundColor: 'rgba(211, 159, 19, 0.08)',
  },
  orbPulseA:
    Platform.OS === 'web'
      ? ({
          animationName: 'tarotOrbPulse',
          animationDuration: '7s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        } as object)
      : {},
  orbPulseB:
    Platform.OS === 'web'
      ? ({
          animationName: 'tarotOrbPulse',
          animationDuration: '9s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '1.2s',
        } as object)
      : {},
  star: {
    position: 'absolute',
    backgroundColor: COLORS.Primary100,
  },
  starTwinkle:
    Platform.OS === 'web'
      ? ({
          animationName: 'tarotStarTwinkle',
          animationDuration: '3.6s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        } as object)
      : {},
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 8),
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 0 120px rgba(8, 12, 20, 0.55)',
        } as object)
      : {}),
  },
  cornerSigil: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 18),
    backgroundColor: getColorOpacity(COLORS.Primary500, 4),
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 24px rgba(246, 192, 27, 0.08)',
        } as object)
      : {}),
  },
});
