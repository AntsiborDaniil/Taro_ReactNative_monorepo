import AppMetrica from '@appmetrica/react-native-analytics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ReactElement, useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, CrossIcon, PlanetIcon } from 'shared/icons';
import { blurActiveElement, WEB_HOVER_TRANSITION } from 'shared/lib';
import { useWebViewportInsets } from 'shared/lib/web/useWebViewportInsets';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';

const FAB_SIZE = 56;
const ACTION_GAP = 10;

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

type MobileFabTabBarProps = BottomTabBarProps;

export function MobileFabTabBar({
  state,
  navigation,
}: MobileFabTabBarProps): ReactElement {
  const { t } = useTranslation('core');
  const [open, setOpen] = useState(false);
  const viewportInsets = useWebViewportInsets();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const focusedRoute = state.routes[state.index]?.name as TabRoute;

  const navigateTo = useCallback(
    async (routeName: TabRoute) => {
      setOpen(false);
      blurActiveElement();
      await handleVibrationClick?.();

      if (routeName === selectedTab) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routeName }],
          })
        );
        return;
      }

      AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName: routeName });
      navigation.navigate(routeName);
      setSelectedTab?.(routeName);
    },
    [handleVibrationClick, navigation, selectedTab, setSelectedTab]
  );

  const anchorBottom = 16 + viewportInsets.bottom;
  const anchorLeft = 16 + viewportInsets.left;

  return (
    <View style={styles.host} pointerEvents="box-none">
      {open ? (
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('nav.fab.close')}
        />
      ) : null}

      <View
        style={[
          styles.anchor,
          { left: anchorLeft, bottom: anchorBottom },
        ]}
        pointerEvents="box-none"
      >
        {open ? (
          <View style={styles.actionsColumn} pointerEvents="box-none">
            {TAB_ITEMS.map(({ route, Icon, labelKey }) => {
              const focused = route === focusedRoute;
              return (
                <Pressable
                  key={route}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={t(labelKey)}
                  onPress={() => navigateTo(route)}
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
                      styles.actionChip,
                      focused && styles.actionChipFocused,
                    ]}
                  >
                    <Icon
                      width={22}
                      height={22}
                      fill={focused ? COLORS.Primary : COLORS.Content}
                    />
                    <Text
                      style={[
                        styles.actionLabel,
                        focused && styles.actionLabelFocused,
                      ]}
                    >
                      {t(labelKey)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            open ? t('nav.fab.close') : t('nav.fab.open')
          }
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={(pressState) => [
            styles.fab,
            open && styles.fabOpen,
            pressState.pressed && styles.fabPressed,
          ]}
        >
          {open ? (
            <CrossIcon width={26} height={26} fill={COLORS.Background} />
          ) : (
            <PlanetIcon width={28} height={28} fill={COLORS.Background} />
          )}
        </Pressable>
      </View>
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
    marginBottom: 12,
  },
  actionPressable: {
    borderRadius: 28,
    ...WEB_HOVER_TRANSITION,
  },
  actionPressableHover: {
    opacity: 0.92,
  },
  actionPressablePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.1)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        } as object)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  actionChipFocused: {
    borderColor: 'rgba(246, 192, 27, 0.45)',
    backgroundColor: 'rgba(246, 192, 27, 0.12)',
  },
  actionLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
    color: COLORS.Content,
  },
  actionLabelFocused: {
    color: COLORS.Content,
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
          boxShadow: '0 10px 28px rgba(246, 192, 27, 0.45)',
          transition: 'transform 0.2s ease',
        } as object)
      : {
          shadowColor: COLORS.Primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        }),
  },
  fabOpen: {
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.15)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        } as object)
      : {}),
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
  },
});
