import React, { useState } from 'react';
import {
  type DimensionValue,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AffirmationCategory,
  AffirmationsContext,
} from 'entities/affirmations';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { DownIcon, UpIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { ImagePosition } from 'shared/types';
import { TileCard } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

import type { AffirmationsLayout } from './useAffirmationsLayout';

const CATEGORIES = [
  {
    category: AffirmationCategory.General,
    name: 'affirmations:general',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(135, 206, 235, 0.36)'],
    hasLock: false,
  },
  {
    category: AffirmationCategory.Career,
    name: 'affirmations:career',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(255, 140, 0, 0.36)'],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Love,
    name: 'affirmations:love',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(255, 20, 147, 0.36)'],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Purpose,
    name: 'affirmations:purpose',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(138, 43, 226, 0.36)'],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Health,
    name: 'affirmations:health',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(34, 139, 34, 0.36)'],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Motivation,
    name: 'affirmations:motivation',
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(255, 69, 0, 0.36)'],
    hasLock: true,
  },
];

type SelectCategoryProps = {
  layout: AffirmationsLayout;
};

const SelectCategory = ({ layout }: SelectCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const translateY = useSharedValue(1000);
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();

  const { handleSelectedAffirmationCategory, selectedAffirmationCategory } =
    useData({
      Context: AffirmationsContext,
    });
  const { isPractitioner } = useData({
    Context: UserContext,
  });
  const { showModal } = useData({ Context: ModalsContext });

  const { t } = useTranslation();
  const isCompact = layout.categoryColumns === 1;
  const maxListHeight = Math.round(
    Math.max(220, Math.min(460, viewportHeight * (isCompact ? 0.46 : 0.42)))
  );
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(translateY.value, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  });

  const toggleSheet = () => {
    if (isOpen) {
      // Закрываем: двигаем вниз на полную высоту контента
      translateY.value = contentHeight;
      setIsOpen(false);
    } else {
      // Открываем: двигаем вверх (translateY = 0)
      translateY.value = 0;
      setIsOpen(true);
    }
  };

  const onContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);

    // Если компонент еще закрыт, устанавливаем начальную позицию
    if (!isOpen) {
      translateY.value = height;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { paddingBottom: Math.max(8, insets.bottom + 4) },
      ]}
    >
      <View
        style={[
          styles.sheetInner,
          {
            width: layout.contentWidth,
            maxWidth: '100%',
            alignSelf: 'center',
            paddingHorizontal: layout.padding,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('affirmations:toggleCategories')}
            onPress={toggleSheet}
            style={(state) => [
              styles.headerButton,
              (state as { hovered?: boolean }).hovered && styles.headerButtonHovered,
              state.pressed && styles.headerButtonPressed,
            ]}
          >
            {isOpen ? <DownIcon width={42} height={42} /> : <UpIcon width={42} height={42} />}
          </Pressable>
        </View>
        <View style={styles.content} onLayout={onContentLayout}>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.category.toString()}
            key={`columns-${layout.categoryColumns}`}
            numColumns={layout.categoryColumns}
            scrollEnabled
            showsVerticalScrollIndicator={isCompact}
            style={[
              styles.list,
              isCompact && { maxHeight: maxListHeight },
            ]}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={
              layout.categoryColumns > 1
                ? [
                    styles.row,
                    {
                      marginBottom: layout.listPaddingBottom,
                      gap: layout.categoryGap,
                    },
                  ]
                : undefined
            }
            renderItem={({ item }) => {
              const isSelected = selectedAffirmationCategory === item.category;
              const cardWidth: DimensionValue =
                layout.categoryColumns === 1 ? '100%' : layout.affirmationCardWidth;
              const handleCardPress = () => {
                if (!isPractitioner && item.hasLock) {
                  showModal?.(<PaidContent />);

                  return;
                }

                handleSelectedAffirmationCategory?.(item.category);
                toggleSheet();
              };

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(item.name)}
                  onPress={handleCardPress}
                  style={(state) => [
                    styles.cardItemWrap,
                    {
                      width: cardWidth,
                      marginBottom: layout.listPaddingBottom,
                    },
                    (state as { hovered?: boolean }).hovered && styles.cardItemHovered,
                    state.pressed && styles.cardItemPressed,
                    isSelected && styles.cardItemSelected,
                  ]}
                >
                  <TileCard
                    id={item.category}
                    textStyles={[
                      styles.cardText,
                      {
                        fontSize: layout.categoryTitleSize,
                        lineHeight: Math.round(layout.categoryTitleSize * 1.2),
                      },
                    ]}
                    isSelected={isSelected}
                    width={cardWidth}
                    isLocked={!isPractitioner && item.hasLock}
                    height={layout.affirmationCardHeight}
                    imagePosition={ImagePosition.Corner}
                    gradient={item.gradient as [string, string]}
                    disabled
                  >
                    {t(item.name)}
                  </TileCard>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(18,24,36,0.96)',
    bottom: Platform.OS === 'ios' ? 24 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0 -10px 26px rgba(0,0,0,0.34)',
  },
  sheetInner: {
    width: '100%',
  },
  cardText: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    color: COLORS.Content,
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  listContainer: {
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  list: {
    width: '100%',
  },
  cardItemWrap: {
    borderRadius: 16,
    ...({
      transition: 'box-shadow 0.2s ease',
    } as object),
  },
  cardItemHovered: {
    ...({
      boxShadow: '0 10px 22px rgba(0,0,0,0.26)',
    } as object),
  },
  cardItemPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  cardItemSelected: {
    ...({
      boxShadow: '0 0 0 1px rgba(246,192,27,0.65), 0 10px 22px rgba(0,0,0,0.24)',
    } as object),
  },
  row: {
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginTop: -22,
    marginBottom: 8,
  },
  headerButton: {
    backgroundColor: COLORS.Background2,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...({
      transition: 'box-shadow 0.2s ease',
      boxShadow: '0 8px 20px rgba(0,0,0,0.34)',
    } as object),
  },
  headerButtonHovered: {
    ...({
      boxShadow: '0 12px 26px rgba(0,0,0,0.4)',
    } as object),
  },
  headerButtonPressed: {
    opacity: 0.92,
  },
  content: {
    minHeight: 100,
  },
});

export default SelectCategory;
