import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Layout, StyleService, useStyleSheet } from '@ui-kitten/components';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet'; // Импортируем универсальный текстовый компонент
import { ChevronLeftIcon, SettingsIcon } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { Text } from 'shared/ui/Text';
import { useHeaderNavigation } from './useHeaderNavigation';

interface CustomHeaderProps {
  title: string; // Текст заголовка
  showBackButton?: boolean; // Опциональная кнопка "Назад"
  backAction?: () => void; // Кастомное действие для кнопки "Назад" (опционально)
  rightAction?: (() => void) | null; // Опциональное действие справа (например, клик по иконке)
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightIconName?: string; // Имя иконки для правого действия (из пакета eva)
  stylesWrapper?: StyleProp<ViewStyle>;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = true,
  backAction,
  rightAction,
  leftContent,
  rightContent,
  stylesWrapper,
}) => {
  const styles = useStyleSheet(themedStyles);

  const { handleBackPress } = useHeaderNavigation({
    backAction,
    showBackButton,
  });

  return (
    <Layout style={[styles.header, stylesWrapper]}>
      {/* Левая кнопка "Назад" (опционально) */}

      {leftContent}

      <TouchableOpacity
        style={styles.backButton}
        onPress={showBackButton ? handleBackPress : undefined}
        activeOpacity={0.7}
        hitSlop={{ top: 16, left: 16, bottom: 16, right: 16 }}
      >
        <ChevronLeftIcon
          opacity={showBackButton ? 1 : 0}
          width={isTablet ? 32 : 24}
          height={isTablet ? 32 : 24}
        />
      </TouchableOpacity>

      {/* Текст заголовка посередине */}
      <Text category="h3" style={styles.title}>
        {title}
      </Text>

      {rightAction ? (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={rightAction}
          activeOpacity={0.7}
          hitSlop={{ top: 16, left: 16, bottom: 16, right: 16 }}
        >
          {rightContent ?? (
            <SettingsIcon
              width={isTablet ? 32 : 24}
              height={isTablet ? 32 : 24}
            />
          )}
        </TouchableOpacity>
      ) : (
        <ChevronLeftIcon opacity={0} width={24} height={24} />
      )}
    </Layout>
  );
};

// Темированные стили с UI Kitten
const themedStyles = StyleService.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    paddingRight: 16,
  },
  rightButton: {
    // marginRight: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginLeft: -16,
  },
});

export default CustomHeader;
