import React, { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
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

  const { handleSelectedAffirmationCategory, selectedAffirmationCategory } =
    useData({
      Context: AffirmationsContext,
    });
  const { isPractitioner } = useData({
    Context: UserContext,
  });
  const { showModal } = useData({ Context: ModalsContext });

  const { t } = useTranslation();

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
    <Animated.View style={[styles.container, animatedStyle]}>
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
          <View style={styles.headerButtonWrapper}>
            <Pressable onPress={toggleSheet} style={styles.headerButton}>
              {isOpen ? (
                <DownIcon width={50} height={50} />
              ) : (
                <UpIcon width={50} height={50} />
              )}
            </Pressable>
          </View>
        </View>
        <View style={styles.content} onLayout={onContentLayout}>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.category.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={[
              styles.row,
              { marginBottom: layout.listPaddingBottom },
            ]}
            renderItem={({ item }) => (
              <TileCard
                id={item.category}
                textStyles={styles.cardText}
                isSelected={selectedAffirmationCategory === item.category}
                width={layout.affirmationCardWidth}
                isLocked={!isPractitioner && item.hasLock}
                height={layout.affirmationCardHeight}
                imagePosition={ImagePosition.Corner}
                gradient={item.gradient as [string, string]}
                onPress={() => {
                  if (!isPractitioner && item.hasLock) {
                    showModal?.(<PaidContent />);

                    return;
                  }

                  handleSelectedAffirmationCategory?.(item.category);
                  toggleSheet();
                }}
              >
                {t(item.name)}
              </TileCard>
            )}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: COLORS.Background2,
    bottom: Platform.OS === 'ios' ? 24 : 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it appears above other elements
    boxShadow: '0px -5px 14.8px 0px #00000040',
  },
  sheetInner: {
    width: '100%',
  },
  cardText: {
    padding: 12,
  },
  listContainer: {
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButtonWrapper: {
    position: 'relative',
  },
  headerButton: {
    position: 'absolute',
    transform: [{ translateX: -30 }, { translateY: -30 }], // Исправлено для React Native
    bottom: -60,
    backgroundColor: COLORS.Background2,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Исправлено для правильного круга
    paddingBottom: 12,
    zIndex: 10,
  },
  content: {
    // Минимальная высота для корректного измерения
    minHeight: 100,
  },
});

export default SelectCategory;
