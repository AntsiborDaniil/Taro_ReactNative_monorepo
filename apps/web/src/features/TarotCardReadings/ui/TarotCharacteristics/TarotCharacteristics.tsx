import { RefObject, useMemo } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ICarouselInstance } from 'react-native-reanimated-carousel';
import { TSelectedTarotCard } from 'shared/api';
import { COLORS } from 'shared/themes';
import { Carousel, Text, TEXT_TAGS } from 'shared/ui';
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
  outerCarouselRef,
  flatListRef,
}: TarotCharacteristicsProps) {
  const { t } = useTranslation();

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

  return (
    <SafeAreaView style={styles.content}>
      <Carousel<TCharacteristicsContent>
        ref={flatListRef}
        outerCarouselRef={outerCarouselRef}
        data={content}
        spaceBetween={20}
        renderItem={({ item, index }) => (
          <SafeAreaView
            style={[
              styles.item,
              {
                marginLeft: index === 0 ? 16 : undefined,
                marginRight: index === content.length - 1 ? 16 : undefined,
              },
            ]}
            key={item.subtitle}
          >
            {item.icon}
            <View style={styles.texts}>
              <Text category={TEXT_TAGS.label} style={styles.label}>
                {t(item.subtitle)}
              </Text>
              <Text>{t(item.title)}</Text>
            </View>
          </SafeAreaView>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    flexDirection: 'row',
    maxHeight: 130,
  },
  item: {
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  label: {
    color: COLORS.SpbSky1,
    fontWeight: 'regular',
  },
  texts: {
    alignItems: 'center',
  },
});

export default TarotCharacteristics;
