import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AffirmationCategory,
  AffirmationsContext,
} from 'entities/affirmations';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import { useData } from 'shared/DataProvider';
import { ChevronRightIcon } from 'shared/icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

import AffirmationCategoryChip from './AffirmationCategoryChip';
import type { AffirmationsLayout } from './useAffirmationsLayout';

const EXPAND_SPRING = { damping: 22, stiffness: 260, mass: 0.85 };
const COLLAPSE_DURATION = 280;

const CATEGORIES = [
  {
    category: AffirmationCategory.General,
    name: 'affirmations:general',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(135, 206, 235, 0.72)'] as [
      string,
      string,
    ],
    hasLock: false,
  },
  {
    category: AffirmationCategory.Career,
    name: 'affirmations:career',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(255, 140, 0, 0.68)'] as [
      string,
      string,
    ],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Love,
    name: 'affirmations:love',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(255, 20, 147, 0.68)'] as [
      string,
      string,
    ],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Purpose,
    name: 'affirmations:purpose',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(138, 43, 226, 0.68)'] as [
      string,
      string,
    ],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Health,
    name: 'affirmations:health',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(34, 139, 34, 0.68)'] as [
      string,
      string,
    ],
    hasLock: true,
  },
  {
    category: AffirmationCategory.Motivation,
    name: 'affirmations:motivation',
    gradient: ['rgba(18, 24, 36, 0.55)', 'rgba(255, 69, 0, 0.68)'] as [
      string,
      string,
    ],
    hasLock: true,
  },
] as const;

type SelectCategoryProps = {
  layout: AffirmationsLayout;
};

const SelectCategory = ({ layout }: SelectCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const expandProgress = useSharedValue(0);
  const measuredContentHeight = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const { handleSelectedAffirmationCategory, selectedAffirmationCategory } =
    useData({ Context: AffirmationsContext });
  const { isAuthenticated } = useData({ Context: UserContext });
  const canAccessLockedCategories = Boolean(isAuthenticated);
  const { showModal } = useData({ Context: ModalsContext });

  const { t } = useTranslation();

  const selectedMeta = useMemo(
    () =>
      CATEGORIES.find((c) => c.category === selectedAffirmationCategory) ??
      CATEGORIES[0],
    [selectedAffirmationCategory]
  );

  const chevronRotation = useSharedValue(90);
  const swatchScale = useSharedValue(1);

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const height = measuredContentHeight.value * expandProgress.value;

    return {
      height,
      opacity: interpolate(expandProgress.value, [0, 0.35, 1], [0, 0.85, 1]),
      transform: [
        {
          translateY: interpolate(expandProgress.value, [0, 1], [10, 0]),
        },
        {
          scale: interpolate(expandProgress.value, [0, 1], [0.98, 1]),
        },
      ],
    };
  });

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const swatchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swatchScale.value }],
  }));

  useEffect(() => {
    chevronRotation.value = withTiming(isOpen ? -90 : 90, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [isOpen, chevronRotation]);

  useEffect(() => {
    swatchScale.value = withSpring(1.12, { damping: 10, stiffness: 260 }, () => {
      swatchScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
  }, [selectedMeta.category, swatchScale]);

  const setExpanded = (next: boolean) => {
    setIsOpen(next);
    expandProgress.value = next
      ? withSpring(1, EXPAND_SPRING)
      : withTiming(0, {
          duration: COLLAPSE_DURATION,
          easing: Easing.in(Easing.cubic),
        });
  };

  const toggleSheet = () => {
    setExpanded(!isOpen);
  };

  const onContentLayout = (event: {
    nativeEvent: { layout: { height: number } };
  }) => {
    const { height } = event.nativeEvent.layout;
    measuredContentHeight.value = height;
  };

  const handleCategoryPress = (item: (typeof CATEGORIES)[number]) => {
    if (!canAccessLockedCategories && item.hasLock) {
      showModal?.(<SignInForSpreadsModal i18nNamespace="affirmations" />);
      return;
    }
    handleSelectedAffirmationCategory?.(item.category);
    if (isOpen) {
      setExpanded(false);
    }
  };

  return (
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(10, insets.bottom + 6) },
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('affirmations:toggleCategories')}
          accessibilityState={{ expanded: isOpen }}
          onPress={toggleSheet}
          style={(state) => [
            styles.handleRow,
            (state as { hovered?: boolean }).hovered && styles.handleRowHovered,
            state.pressed && styles.handleRowPressed,
          ]}
        >
          <View style={styles.dragPill} />
          <View style={styles.handleMain}>
            <View style={styles.handleTextCol}>
              <Text category={TEXT_TAGS.p2} style={styles.handleEyebrow}>
                {t('affirmations:pickCategoryEyebrow')}
              </Text>
              <Text
                category={TEXT_TAGS.h4}
                weight={TEXT_WEIGHT.medium}
                numberOfLines={1}
                style={styles.handleTitle}
              >
                {isOpen
                  ? t('affirmations:pickCategoryTitle')
                  : t(selectedMeta.name)}
              </Text>
            </View>
            <Animated.View
              style={[
                styles.previewSwatch,
                swatchAnimatedStyle,
                { backgroundColor: selectedMeta.gradient[1] },
              ]}
            />
            <Animated.View style={[styles.chevronWrap, chevronAnimatedStyle]}>
              <ChevronRightIcon width={18} height={18} fill={COLORS.Primary} />
            </Animated.View>
          </View>
        </Pressable>

        <Animated.View
          style={[styles.content, contentAnimatedStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <View style={styles.contentMeasure} onLayout={onContentLayout}>
            <ScrollView
              style={{ maxHeight: layout.pickerMaxHeight }}
              showsVerticalScrollIndicator={layout.isNarrow && isOpen}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={isOpen}
              contentContainerStyle={[
                styles.grid,
                {
                  gap: layout.categoryGap,
                  paddingBottom: 4,
                },
              ]}
            >
              {CATEGORIES.map((item, index) => (
                <AffirmationCategoryChip
                  key={item.category}
                  index={index}
                  animateIn={isOpen}
                  labelKey={item.name}
                  gradient={item.gradient}
                  width={layout.categoryChipWidth}
                  height={layout.categoryChipHeight}
                  fontSize={layout.categoryTitleSize}
                  isSelected={
                    selectedAffirmationCategory === item.category
                  }
                  isLocked={!canAccessLockedCategories && item.hasLock}
                  onPress={() => handleCategoryPress(item)}
                />
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(14, 18, 28, 0.94)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.45)',
        } as object)
      : {}),
  },
  sheetInner: {
    width: '100%',
  },
  handleRow: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    ...WEB_HOVER_TRANSITION,
  },
  handleRowHovered: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  handleRowPressed: {
    opacity: 0.92,
  },
  dragPill: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 10,
  },
  handleMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  handleTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  handleEyebrow: {
    color: 'rgba(186, 204, 235, 0.62)',
    fontSize: 12,
    lineHeight: 16,
  },
  handleTitle: {
    color: COLORS.Content,
  },
  previewSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    overflow: 'hidden',
  },
  contentMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
});

export default SelectCategory;
