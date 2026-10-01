import { useCallback } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { setNavReturnToMain } from 'app/navigation/navReturnStore';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getImage } from 'shared/lib';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import {
  AnalyticAction,
  NavigationRoute,
  TabRoute,
} from 'shared/types';
import {
  DS_COLORS,
  DS_MOTION,
  DS_SIZES,
  DS_SPACE,
  dsFocusRing,
  dsRadius,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
} from 'shared/themes/ds';
import { useReducedMotion } from 'react-native-reanimated';
import { dsItemName } from 'pages/main/lib/dsExtra';
import { useKeyboardFocusVisible } from 'pages/main/lib/useKeyboardFocusVisible';
import { Chevron } from '../icons';

type QuickLink = {
  id: string;
  labelKey: string;
  subtitleKey: string;
  tabRoute: TabRoute;
  route: NavigationRoute;
  img: ImageSourcePropType;
};

const LINKS: QuickLink[] = [
  {
    id: 'favorite',
    labelKey: 'core:library.tile.favorite.title',
    subtitleKey: 'core:library.tile.favorite.subtitle',
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
    subtitleKey: 'core:library.tile.dictionary.subtitle',
    tabRoute: TabRoute.LibraryTab,
    route: NavigationRoute.CardsDictionary,
    img: getImage([
      'core',
      'cardsDescriptionsBackgroundClear',
    ]) as ImageSourcePropType,
  },
];

const ROW_RADIUS = dsRadius.listRow;
const THUMB_RADIUS = dsRadius.card(DS_SIZES.listRowThumb);

function MainQuickLinks() {
  const { t } = useTranslation();
  const navigation = useNativeNavigation();
  const reducedMotion = useReducedMotion();
  const hint = t('main:quickLinks.a11yHint');

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
      // From Main → nested Library screen: Back returns to Main.
      setNavReturnToMain();
      // Plain nested navigate: a full-tab reset no-ops inside the Mini App.
      // Cast: navigate() overloads don't accept a tab name from a variable.
      const navigateToTab = navigation.navigate as (
        tab: TabRoute,
        params: { screen: NavigationRoute }
      ) => void;
      navigateToTab(link.tabRoute, { screen: link.route });
    },
    [handleVibrationClick, navigation, setSelectedTab]
  );

  return (
    <View style={styles.list}>
      {LINKS.map((link) => (
        <QuickLinkRow
          key={link.id}
          link={link}
          hint={hint}
          reducedMotion={!!reducedMotion}
          onPress={() => {
            void onPress(link);
          }}
        />
      ))}
    </View>
  );
}

function QuickLinkRow({
  link,
  hint,
  reducedMotion,
  onPress,
}: {
  link: QuickLink;
  hint: string;
  reducedMotion: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(link.labelKey)}
      accessibilityHint={hint || undefined}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...(Platform.OS === 'web'
        ? ({
            onClick: (event: { stopPropagation?: () => void }) => {
              event?.stopPropagation?.();
              onPress();
            },
          } as object)
        : {})}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        reducedMotion ? dsWebTransitionReduced : dsWebTransition,
        {
          borderColor: hovered ? DS_COLORS.accent400 : 'transparent',
          transform: pressed ? [{ translateY: DS_MOTION.pressShiftY }] : undefined,
        },
        focusVisible && dsFocusRing,
      ]}
    >
      {({ pressed }: { pressed: boolean }) => (
        <>
          <View style={styles.thumbFrame}>
            <Image source={link.img} resizeMode="contain" style={styles.thumbImage} />
          </View>
          <View style={styles.textCol}>
            <Text numberOfLines={2} style={dsItemName(DS_COLORS.ink50)}>
              {t(link.labelKey)}
            </Text>
            <Text numberOfLines={1} style={dsText('micro', DS_COLORS.ink100)}>
              {t(link.subtitleKey)}
            </Text>
          </View>
          <Chevron size={18} color={DS_COLORS.accent400} />
          {pressed ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressOverlay]} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export default MainQuickLinks;

const styles = StyleSheet.create({
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: DS_SPACE.s,
  },
  row: {
    width: '100%',
    height: DS_SIZES.listRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS_SPACE.m,
    paddingHorizontal: DS_SPACE.l,
    borderRadius: ROW_RADIUS,
    borderWidth: 1,
    backgroundColor: DS_COLORS.ground600,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbFrame: {
    width: DS_SIZES.listRowThumb,
    height: DS_SIZES.listRowThumb,
    borderRadius: THUMB_RADIUS,
    borderWidth: 1,
    borderColor: DS_COLORS.ground700,
    backgroundColor: DS_COLORS.ground800,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImage: {
    width: DS_SIZES.listRowThumb - 10,
    height: DS_SIZES.listRowThumb - 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pressOverlay: {
    backgroundColor: DS_COLORS.pressDim,
  },
});
