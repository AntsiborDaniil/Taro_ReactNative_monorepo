import { RefObject, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

const GRID_GAP = 16;
const HORIZONTAL_PAD = 32;

/** Колонок в сетке по ширине сцены (учёт rail на web). */
function getCharacteristicColumnCount(
  containerWidth: number,
  itemCount: number
): number {
  if (itemCount <= 0) {
    return 1;
  }
  let cols: number;
  if (containerWidth >= 900) {
    cols = 3;
  } else if (containerWidth >= 560) {
    cols = 2;
  } else {
    cols = 1;
  }
  return Math.min(cols, itemCount);
}

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

  const containerWidth = Math.max(
    220,
    sceneContentWidth - HORIZONTAL_PAD
  );

  const columnCount = getCharacteristicColumnCount(
    containerWidth,
    content.length
  );

  const flexItemWidth = Math.max(
    148,
    Math.floor(
      (containerWidth - GRID_GAP * (columnCount - 1)) / columnCount
    )
  );

  const gridStyle = useMemo(() => {
    if (Platform.OS === 'web') {
      return {
        display: 'grid' as const,
        width: '100%' as const,
        maxWidth: containerWidth,
        gap: GRID_GAP,
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        justifyItems: 'stretch' as const,
        alignItems: 'flex-start' as const,
      };
    }
    return {
      width: '100%' as const,
      maxWidth: containerWidth,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: GRID_GAP,
    };
  }, [columnCount, containerWidth]);

  return (
    <View style={styles.content}>
      <View style={[styles.grid, gridStyle]}>
        {content.map((item) => (
          <View
            style={[
              styles.item,
              Platform.OS === 'web' ? styles.itemGrid : { width: flexItemWidth },
            ]}
            key={item.subtitle}
          >
            {item.icon}
            <View style={styles.texts}>
              <Text category={TEXT_TAGS.label} style={styles.label}>
                {t(item.subtitle)}
              </Text>
              <Text style={styles.title}>{t(item.title)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'center',
  },
  grid: {
    alignSelf: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    minHeight: 112,
  },
  itemGrid: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
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
