import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TextStyle,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Layout, StyleService, useStyleSheet } from '@ui-kitten/components';
import type { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { ChevronLeftIcon, SettingsIcon } from 'shared/icons';
import { isTablet, WEB_HOVER_TRANSITION } from 'shared/lib';
import { Text } from 'shared/ui/Text';
import { useHeaderNavigation } from './useHeaderNavigation';

interface CustomHeaderProps {
  title: string; // Текст заголовка
  showBackButton?: boolean; // Опциональная кнопка "Назад"
  backAction?: () => void; // Кастомное действие для кнопки "Назад" (опционально)
  rightAction?: (() => void) | null; // Опциональное действие справа (например, клик по иконке)
  rightContent?: React.ReactNode;
  /** Подпись для кнопки справа (VoiceOver / TalkBack / веб) */
  rightAccessibilityLabel?: string;
  leftContent?: React.ReactNode;
  rightIconName?: string; // Имя иконки для правого действия (из пакета eva)
  stylesWrapper?: StyleProp<ViewStyle>;
  /** Доп. стили заголовка (например меньший кегль на узком экране) */
  titleStyle?: StyleProp<TextStyle>;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = true,
  backAction,
  rightAction,
  leftContent,
  rightContent,
  rightAccessibilityLabel,
  stylesWrapper,
  titleStyle,
}) => {
  const styles = useStyleSheet(themedStyles);
  const { t } = useTranslation();

  const { handleBackPress } = useHeaderNavigation({
    backAction,
    showBackButton,
  });

  return (
    <Layout
      style={StyleSheet.flatten([styles.header, stylesWrapper as StyleProp<ViewStyle>])}
    >
      <View style={styles.sideSlot}>
        {leftContent}
        <TouchableOpacity
          style={styles.backButton}
          onPress={showBackButton ? handleBackPress : undefined}
          activeOpacity={0.7}
          hitSlop={{ top: 16, left: 16, bottom: 16, right: 16 }}
          accessible={showBackButton}
          accessibilityRole="button"
          accessibilityLabel={t('core:a11y.back')}
        >
          <ChevronLeftIcon
            opacity={showBackButton ? 1 : 0}
            width={isTablet ? 32 : 24}
            height={isTablet ? 32 : 24}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSlot}>
        <Text
          category="h3"
          numberOfLines={1}
          style={StyleSheet.flatten([styles.title, titleStyle])}
        >
          {title}
        </Text>
      </View>

      <View style={[styles.sideSlot, styles.rightSlot]}>
        {rightAction ? (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={rightAction}
            activeOpacity={0.7}
            hitSlop={{ top: 16, left: 16, bottom: 16, right: 16 }}
            accessibilityRole="button"
            accessibilityLabel={
              rightAccessibilityLabel ??
              (rightContent
                ? t('core:a11y.headerActions')
                : t('core:a11y.settings'))
            }
          >
            {rightContent ?? (
              <SettingsIcon
                width={isTablet ? 32 : 24}
                height={isTablet ? 32 : 24}
              />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButtonPlaceholder}>
            <ChevronLeftIcon opacity={0} width={24} height={24} />
          </View>
        )}
      </View>
    </Layout>
  );
};

// Темированные стили с UI Kitten
const themedStyles = StyleService.create({
  header: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  sideSlot: {
    minWidth: 56,
    maxWidth: '25%',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  titleSlot: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  backButton: {
    padding: 8,
    paddingRight: 8,
    ...WEB_HOVER_TRANSITION,
  },
  rightButton: {
    padding: 8,
    ...WEB_HOVER_TRANSITION,
  },
  rightButtonPlaceholder: {
    padding: 8,
  },
  title: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default CustomHeader;
