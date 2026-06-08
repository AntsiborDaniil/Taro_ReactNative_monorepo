import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DeckStyle, type TSpread } from 'shared/api';
import { getImage } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';
import { SPREAD_CATEGORY_ACCENT, spreadInnerStyles } from 'shared/lib/spreadInnerUi';

type SpreadHeroBannerProps = {
  spread: TSpread;
  categoryLabel: string;
};

function SpreadHeroBanner({ spread, categoryLabel }: SpreadHeroBannerProps) {
  const { t } = useTranslation();
  const accent = SPREAD_CATEGORY_ACCENT[spread.category];

  return (
    <View style={spreadInnerStyles.heroShell}>
      <Image
        source={getImage(['spreads', DeckStyle.FlatIllustration, spread.id])}
        resizeMode="cover"
        style={spreadInnerStyles.heroImage}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[
          getColorOpacity(COLORS.Background, 0),
          getColorOpacity(COLORS.Background, 92),
        ]}
        style={spreadInnerStyles.heroFade}
      />
      <View style={styles.overlay}>
        <View
          style={[
            spreadInnerStyles.categoryChip,
            {
              borderColor: getColorOpacity(accent, 45),
              backgroundColor: getColorOpacity(accent, 14),
            },
          ]}
        >
          <Text
            category={TEXT_TAGS.label}
            style={[spreadInnerStyles.categoryChipText, { color: accent }]}
          >
            {categoryLabel}
          </Text>
        </View>
        <Text
          category={TEXT_TAGS.h3}
          weight="bold"
          style={styles.heroTitle}
          numberOfLines={2}
        >
          {t(spread.name)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  heroTitle: {
    textAlign: 'center',
    color: COLORS.Content,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

export default SpreadHeroBanner;
