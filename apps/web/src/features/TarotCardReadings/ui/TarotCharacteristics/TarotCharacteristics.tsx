import { RefObject, useMemo } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { useTranslation } from 'react-i18next';
import { ICarouselInstance } from 'react-native-reanimated-carousel';
import { TSelectedTarotCard } from 'shared/api';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';
import {
  ARCANAS,
  ELEMENTS,
  PLANETS,
  TCharacteristicsContent,
  TCharacteristicsLibrary,
  ZODIACS,
} from './Items';

type TarotCharacteristicsProps = {
  card: TSelectedTarotCard;
  outerCarouselRef?: RefObject<ICarouselInstance>;
  flatListRef?: RefObject<any>;
};

function TarotCharacteristics({
  card,
  outerCarouselRef: _outerCarouselRef,
  flatListRef: _flatListRef,
}: TarotCharacteristicsProps) {
  const { t } = useTranslation();
  const { sceneContentWidth } = useTabRailLayout();

  const content = useMemo(() => {
    const libraryItems: {
      key: string;
      library: TCharacteristicsLibrary;
    }[] = [
      {
        key: card.suit || card.arcana,
        library: ARCANAS,
      },
      {
        key: card.astrology?.planet ?? '',
        library: PLANETS,
      },
      {
        key: card.astrology?.zodiac ?? '',
        library: ZODIACS,
      },
      {
        key: card.element ?? '',
        library: ELEMENTS,
      },
    ];

    return libraryItems.reduce((acc: TCharacteristicsContent[], cur) => {
      const item = cur.library[cur.key];

      if (!item) {
        return acc;
      }

      return [...acc, item];
    }, []);
  }, [
    card.arcana,
    card.astrology?.planet,
    card.astrology?.zodiac,
    card.element,
    card.suit,
  ]);

  const horizontalPad = 32;
  const gap = 16;
  const containerWidth = Math.max(220, sceneContentWidth - horizontalPad);
  const columns = containerWidth >= 920 ? 4 : containerWidth >= 520 ? 2 : 1;
  const itemWidth = Math.max(
    180,
    Math.floor((containerWidth - gap * (columns - 1)) / columns)
  );

  return (
    <SafeAreaView style={styles.content}>
      <View style={[styles.grid, { maxWidth: containerWidth }]}>
        {content.map((item) => (
          <SafeAreaView style={[styles.item, { width: itemWidth }]} key={item.subtitle}>
            {item.icon}
            <View style={styles.texts}>
              <Text category={TEXT_TAGS.label} style={styles.label}>
                {t(item.subtitle)}
              </Text>
              <Text style={styles.title}>{t(item.title)}</Text>
            </View>
          </SafeAreaView>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    minHeight: 130,
  },
  label: {
    color: COLORS.SpbSky1,
    fontWeight: 'regular',
    textAlign: 'center',
  },
  texts: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
});

export default TarotCharacteristics;
