import AppMetrica from '@appmetrica/react-native-analytics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createResetTabToRootAction } from '../resetTabToRoot';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, CrossIcon, PlanetIcon } from 'shared/icons';
import { blurActiveElement, WEB_HOVER_TRANSITION } from 'shared/lib';
import { useWebViewportInsets } from 'shared/lib/web/useWebViewportInsets';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';
import {
  markFabDiscoveredInSession,
  readFabDiscoveredFromSession,
  useMobileFabScrollContext,
  useMobileFabPeekVisible,
  useMobileFabRevealOnRouteChange,
} from './MobileFabScrollContext';
import { isFabHostScreenFromTabState } from './mobileFabVisibility';

const FAB_SIZE = 48;
const ACTION_SIZE = 44;
const ACTION_GAP = 8;
const OPEN_SPRING = { damping: 15, stiffness: 240, mass: 0.85 };
const CLOSE_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };
const PEEK_HIDE_TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

const TAB_ITEMS = [
  {
    route: TabRoute.MainTab,
    Icon: PlanetIcon,
    labelKey: 'nav.tab.main' as const,
  },
  {
    route: TabRoute.SpreadsTab,
    Icon: CardsIcon,
    labelKey: 'nav.tab.spreads' as const,
  },
  {
    route: TabRoute.LibraryTab,
    Icon: BookIcon,
    labelKey: 'nav.tab.library' as const,
  },
] as const;

type FabActionItemProps = {
  index: number;
  Icon: (typeof TAB_ITEMS)[number]['Icon'];
  label: string;
  focused: boolean;
  openProgress: SharedValue<number>;
  onPress: () => void;
};

function FabActionItem({
  index,
  Icon,
  label,
  focused,
  openProgress,
  onPress,
}: FabActionItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stagger = index * 0.09;
    const progress = interpolate(
      openProgress.value,
      [stagger, Math.min(stagger + 0.5, 1)],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [18, 0]) },
        { scale: interpolate(progress, [0, 1], [0.75, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        style={(pressState) => {
          const hovered =
            Platform.OS === 'web' &&
            (pressState as { hovered?: boolean }).hovered;
          return [
            styles.actionPressable,
            hovered && styles.actionPressableHover,
            pressState.pressed && styles.actionPressablePressed,
          ];
        }}
      >
        <View
          style={[
            styles.actionIconBtn,
            focused && styles.actionIconBtnFocused,
          ]}
        >
          <Icon
            width={20}
            height={20}
            fill={focused ? COLORS.Primary : COLORS.Content}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

type MobileFabTabBarProps = BottomTabBarProps;

export function MobileFabTabBar({
  state,
  navigation,
}: MobileFabTabBarProps): ReactElement {
  const { t } = useTranslation('core');
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabDiscovered, setFabDiscovered] = useState(readFabDiscoveredFromSession);
  const openProgress = useSharedValue(0);
  const peekHide = useSharedValue(0);
  const discoverOpacity = useSharedValue(fabDiscovered ? 1 : 0.88);
  const viewportInsets = useWebViewportInsets();
  const fabPeekVisible = useMobileFabPeekVisible();
  const fabScrollCtx = useMobileFabScrollContext();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const focusedRoute = state.routes[state.index]?.name as TabRoute;
  useMobileFabRevealOnRouteChange(focusedRoute);

  const isFabHostScreen = useMemo(
    () => isFabHostScreenFromTabState(state),
    [state]
  );
  const wasFabHostRef = useRef(isFabHostScreen);

  useEffect(() => {
    fabScrollCtx?.setFabHostScreen(isFabHostScreen);
  }, [fabScrollCtx, isFabHostScreen]);

  useEffect(() => {
    if (isFabHostScreen && !wasFabHostRef.current) {
      fabScrollCtx?.setFabPeekVisible(true);
    }
    wasFabHostRef.current = isFabHostScreen;
  }, [fabScrollCtx, isFabHostScreen]);

  const anchorBottom = 16 + viewportInsets.bottom;
  const anchorLeft = 16 + viewportInsets.left;

  const shouldShowFab = isFabHostScreen && (menuOpen || fabPeekVisible);

  useEffect(() => {
    peekHide.value = withTiming(shouldShowFab ? 0 : 1, PEEK_HIDE_TIMING);
  }, [shouldShowFab, peekHide]);

  useEffect(() => {
    discoverOpacity.value = withTiming(fabDiscovered ? 1 : 0.88, { duration: 300 });
  }, [fabDiscovered, discoverOpacity]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        markFabDiscoveredInSession();
        setFabDiscovered(true);
      }
      setMenuOpen(next);
      openProgress.value = next
        ? withSpring(1, OPEN_SPRING)
        : withTiming(0, CLOSE_TIMING);
    },
    [openProgress]
  );

  const toggleOpen = useCallback(() => {
    setOpen(!menuOpen);
  }, [menuOpen, setOpen]);

  useEffect(() => {
    if (!isFabHostScreen && menuOpen) {
      setOpen(false);
    }
  }, [isFabHostScreen, menuOpen, setOpen]);

  const navigateTo = useCallback(
    async (routeName: TabRoute) => {
      setOpen(false);
      blurActiveElement();
      await handleVibrationClick?.();

      if (routeName === selectedTab) {
        navigation.dispatch(createResetTabToRootAction(routeName));
        return;
      }

      AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName: routeName });
      navigation.navigate(routeName);
      setSelectedTab?.(routeName);
    },
    [handleVibrationClick, navigation, selectedTab, setOpen, setSelectedTab]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 1], [0, 1]),
  }));

  const anchorStyle = useAnimatedStyle(() => {
    const hideOffset = FAB_SIZE + anchorBottom + 24;

    return {
      opacity:
        discoverOpacity.value *
        interpolate(peekHide.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(peekHide.value, [0, 1], [0, hideOffset]),
        },
        {
          scale: interpolate(peekHide.value, [0, 1], [1, 0.9]),
        },
      ],
    };
  });

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(openProgress.value, [0, 1], [0, 90])}deg`,
      },
      {
        scale: interpolate(openProgress.value, [0, 0.5, 1], [1, 1.05, 1]),
      },
    ],
  }));

  const planetIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.35], [1, 0]),
    transform: [
      { scale: interpolate(openProgress.value, [0, 0.35], [1, 0.6]) },
    ],
  }));

  const crossIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0.45, 1], [0, 1]),
    transform: [
      { scale: interpolate(openProgress.value, [0.45, 1], [0.6, 1]) },
    ],
  }));

  const actionsColumnStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.15], [0, 1]),
  }));

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={menuOpen ? 'auto' : 'none'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('nav.fab.close')}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.anchor,
          { left: anchorLeft, bottom: anchorBottom },
          anchorStyle,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.actionsColumn, actionsColumnStyle]}
          pointerEvents={menuOpen ? 'box-none' : 'none'}
        >
          {TAB_ITEMS.map(({ route, Icon, labelKey }, index) => (
            <FabActionItem
              key={route}
              index={index}
              Icon={Icon}
              label={t(labelKey)}
              focused={route === focusedRoute}
              openProgress={openProgress}
              onPress={() => navigateTo(route)}
            />
          ))}
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? t('nav.fab.close') : t('nav.fab.open')}
          accessibilityState={{ expanded: menuOpen }}
          onPress={toggleOpen}
        >
          <Animated.View
            style={[styles.fab, fabStyle, menuOpen && styles.fabOpen]}
          >
            <Animated.View style={[styles.fabIconLayer, planetIconStyle]}>
              <PlanetIcon width={24} height={24} fill={COLORS.Background} />
            </Animated.View>
            <Animated.View style={[styles.fabIconLayer, crossIconStyle]}>
              <CrossIcon width={22} height={22} fill={COLORS.Content} />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: 0,
    zIndex: 120,
    elevation: 120,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'box-none' } as object) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.55)',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 110,
        } as object)
      : {}),
  },
  anchor: {
    position: 'absolute',
    alignItems: 'flex-start',
    zIndex: 130,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
        } as object)
      : {}),
  },
  actionsColumn: {
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    gap: ACTION_GAP,
    marginBottom: 10,
  },
  actionPressable: {
    borderRadius: ACTION_SIZE / 2,
    ...WEB_HOVER_TRANSITION,
  },
  actionPressableHover: {
    opacity: 0.92,
  },
  actionPressablePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  actionIconBtn: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.12)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.32)',
        } as object)
      : {
          elevation: 6,
        }),
  },
  actionIconBtnFocused: {
    borderColor: 'rgba(246, 192, 27, 0.5)',
    backgroundColor: 'rgba(246, 192, 27, 0.14)',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 22px rgba(246, 192, 27, 0.42)',
        } as object)
      : {
          shadowColor: COLORS.Primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.38,
          shadowRadius: 10,
          elevation: 10,
        }),
  },
  fabOpen: {
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.15)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.38)',
        } as object)
      : {}),
  },
  fabIconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
