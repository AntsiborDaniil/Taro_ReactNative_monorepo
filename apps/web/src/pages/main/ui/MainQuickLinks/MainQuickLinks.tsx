import { useCallback } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { navigateInTab } from 'app/navigation/navigateInTab';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon } from 'shared/icons';
import { getImage, WEB_HOVER_TRANSITION } from 'shared/lib';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { COLORS, getColorOpacity } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

type QuickLink = {
  id: string;
  labelKey: string;
  tabRoute: TabRoute;
  route: NavigationRoute;
  img: ImageSourcePropType;
};

const LINKS: QuickLink[] = [
  {
    id: 'favorite',
    labelKey: 'core:library.tile.favorite.title',
    tabRoute: TabRoute.LibraryTab,
    route: NavigationRoute.FavoriteCards,
    img: getImage([
      'core',
      'favoriteCardsBackgroundClear',
    ]) as ImageSourcePropType,
  },
  {
    id: 'dictionary',
    labelKey: 'core:library.tile.dictionary.title',
    tabRoute: TabRoute.LibraryTab,
    route: NavigationRoute.CardsDictionary,
    img: getImage([
      'core',
      'cardsDescriptionsBackgroundClear',
    ]) as ImageSourcePropType,
  },
];

function MainQuickLinks() {
  const { t } = useTranslation();
  const navigation = useNativeNavigation();
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const thumb = isCompact ? 40 : 46;

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });

  const onPress = useCallback(
    async (link: QuickLink) => {
      AppMetrica.reportEvent(AnalyticAction.ClickCategoryMainPage, {
        category: link.id,
      });
      await handleVibrationClick?.();
      setSelectedTab?.(link.tabRoute);
      // From Main → Library nested screen: reset stack so Back returns to Library root.
      navigateInTab(navigation, {
        tab: link.tabRoute,
        screen: link.route,
      });
    },
    [handleVibrationClick, navigation, setSelectedTab]
  );

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      {LINKS.map((link) => (
        <Pressable
          key={link.id}
          accessibilityRole="button"
          accessibilityLabel={t(link.labelKey)}
          onPress={() => onPress(link)}
          style={(state: PressableStateCallbackType) => [
            styles.chip,
            isCompact && styles.chipCompact,
            (state.pressed || Boolean(state.hovered)) && styles.chipActive,
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              getColorOpacity(COLORS.Primary, 10),
              'rgba(30, 35, 43, 0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.thumbRing,
              {
                width: thumb,
                height: thumb,
                borderRadius: Math.round(thumb * 0.32),
              },
            ]}
          >
            <Image
              source={link.img}
              resizeMode="contain"
              style={[
                styles.thumb,
                {
                  width: thumb - 2,
                  height: thumb - 2,
                  borderRadius: Math.round((thumb - 2) * 0.3),
                },
              ]}
            />
          </View>
          <Text
            category={TEXT_TAGS.h5}
            weight={TEXT_WEIGHT.medium}
            numberOfLines={2}
            style={[styles.label, isCompact && styles.labelCompact]}
          >
            {t(link.labelKey)}
          </Text>
          <ChevronRightIcon
            width={isCompact ? 16 : 18}
            height={isCompact ? 16 : 18}
            opacity={0.55}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default MainQuickLinks;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
  },
  rowCompact: {
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.18)',
    backgroundColor: 'rgba(30, 35, 43, 0.62)',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          boxShadow:
            '0 10px 22px rgba(8, 12, 20, 0.32), inset 0 1px 0 rgba(246, 192, 27, 0.07)',
          ...WEB_HOVER_TRANSITION,
        } as object)
      : {}),
  },
  chipCompact: {
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 12,
  },
  chipActive: {
    borderColor: 'rgba(246, 192, 27, 0.4)',
    backgroundColor: 'rgba(38, 44, 54, 0.9)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 12px 26px rgba(8, 12, 20, 0.4), 0 0 18px rgba(246, 192, 27, 0.12), inset 0 1px 0 rgba(246, 192, 27, 0.12)',
          transform: [{ translateY: -1 }],
        } as object)
      : {}),
  },
  thumbRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.38)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    flexShrink: 0,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 12px rgba(246, 192, 27, 0.12)',
        } as object)
      : {}),
  },
  thumb: {
    backgroundColor: 'transparent',
  },
  label: {
    flex: 1,
    minWidth: 0,
    color: COLORS.Content,
    letterSpacing: 0.25,
  },
  labelCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
});
