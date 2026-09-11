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
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';
import { useHeaderNavigation } from './useHeaderNavigation';
import {
  HeaderSpreadQuotaBadge,
  useHeaderSpreadQuota,
} from './useHeaderSpreadQuota';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  backAction?: () => void;
  rightAction?: (() => void) | null;
  rightContent?: React.ReactNode;
  rightAccessibilityLabel?: string;
  leftContent?: React.ReactNode;
  rightIconName?: string;
  stylesWrapper?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  /** Hide global credits chip (e.g. when screen already renders its own). */
  hideSpreadQuota?: boolean;
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
  hideSpreadQuota = false,
}) => {
  const styles = useStyleSheet(themedStyles);
  const { t } = useTranslation();
  const spreadQuota = useHeaderSpreadQuota();

  const { handleBackPress } = useHeaderNavigation({
    backAction,
    showBackButton,
  });

  const showQuota = !hideSpreadQuota && spreadQuota != null;
  const showCustomRight = Boolean(rightContent) || rightAction != null;

  return (
    <Layout
      style={StyleSheet.flatten([styles.header, stylesWrapper as StyleProp<ViewStyle>])}
    >
      {/* True screen-center title — ignores unequal left/right action widths */}
      <View style={styles.titleOverlay} pointerEvents="none">
        <Text
          category={TEXT_TAGS.h2}
          weight={TEXT_WEIGHT.medium}
          numberOfLines={1}
          style={StyleSheet.flatten([styles.title, titleStyle])}
        >
          {title}
        </Text>
      </View>

      <View style={[styles.sideSlot, styles.leftSlot]}>
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

      <View style={styles.sideSpacer} />

      <View style={[styles.sideSlot, styles.rightSlot]}>
        {showQuota || showCustomRight ? (
          <View style={styles.rightCluster}>
            {showQuota ? (
              <TouchableOpacity
                style={styles.quotaButton}
                onPress={spreadQuota.onPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, left: 8, bottom: 10, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={spreadQuota.a11yLabel}
              >
                <HeaderSpreadQuotaBadge quota={spreadQuota} />
              </TouchableOpacity>
            ) : null}
            {showCustomRight ? (
              <TouchableOpacity
                style={styles.rightButton}
                onPress={rightAction ?? undefined}
                disabled={!rightAction}
                activeOpacity={rightAction ? 0.7 : 1}
                hitSlop={{ top: 12, left: 8, bottom: 12, right: 12 }}
                accessibilityRole={rightAction ? 'button' : 'none'}
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
            ) : null}
          </View>
        ) : (
          <View style={styles.rightButtonPlaceholder}>
            <ChevronLeftIcon opacity={0} width={24} height={24} />
          </View>
        )}
      </View>
    </Layout>
  );
};

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
  titleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 72,
    zIndex: 0,
  },
  sideSlot: {
    zIndex: 1,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  leftSlot: {
    alignItems: 'flex-start',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  sideSpacer: {
    flex: 1,
    minWidth: 0,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingRight: 2,
  },
  backButton: {
    padding: 8,
    paddingRight: 8,
    ...WEB_HOVER_TRANSITION,
  },
  quotaButton: {
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 4,
    marginRight: 2,
    ...WEB_HOVER_TRANSITION,
  },
  rightButton: {
    padding: 6,
    ...WEB_HOVER_TRANSITION,
  },
  rightButtonPlaceholder: {
    padding: 8,
  },
  title: {
    textAlign: 'center',
    paddingHorizontal: 4,
    maxWidth: '100%',
  },
});

export default CustomHeader;
