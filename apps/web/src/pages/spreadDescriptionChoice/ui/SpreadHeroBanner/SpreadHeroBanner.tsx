import { useCallback, useState } from 'react';
import { Image, type LayoutChangeEvent, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DeckStyle, type TSpread } from 'shared/api';
import { getImage } from 'shared/lib';
import { DS_COLORS, dsRadius, dsText } from 'shared/themes/ds';
import { SPREAD_CATEGORY_ACCENT, spreadInnerStyles } from 'shared/lib/spreadInnerUi';

type SpreadHeroBannerProps = {
  spread: TSpread;
  categoryLabel: string;
};

/** Источники spreads/flatIllustration — 1536×768 (2:1), см. SpreadCatalogCard. */
const HERO_IMAGE_ASPECT = 0.5;

/** Карточка «Журнал»: картинка сверху, подпись — плоским блоком ниже (без градиента-затемнения). */
function SpreadHeroBanner({ spread, categoryLabel }: SpreadHeroBannerProps) {
  const { t } = useTranslation();
  const accent = SPREAD_CATEGORY_ACCENT[spread.category];
  const [heroWidth, setHeroWidth] = useState(0);
  const handleHeroLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    setHeroWidth((prev) => (prev === width ? prev : width));
  }, []);
  const heroHeight = Math.round(heroWidth * HERO_IMAGE_ASPECT);

  return (
    <View
      style={[
        spreadInnerStyles.heroShell,
        heroWidth > 0 ? { borderRadius: dsRadius.window(heroWidth) } : null,
      ]}
      onLayout={handleHeroLayout}
    >
      {/* RN Web: Image растягивается процентной шириной ненадёжно — задаём измеренные px. */}
      {heroWidth > 0 && (
        <Image
          source={getImage(['spreads', DeckStyle.FlatIllustration, spread.id])}
          resizeMode="cover"
          style={{ width: heroWidth, height: heroHeight }}
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={spreadInnerStyles.heroFade}>
        <Text
          style={[spreadInnerStyles.categoryEyebrow, { color: accent }]}
          numberOfLines={1}
        >
          {categoryLabel}
        </Text>
        <Text style={[dsText('title', DS_COLORS.ink50), { textAlign: 'center' }]} numberOfLines={2}>
          {t(spread.name)}
        </Text>
      </View>
    </View>
  );
}

export default SpreadHeroBanner;
