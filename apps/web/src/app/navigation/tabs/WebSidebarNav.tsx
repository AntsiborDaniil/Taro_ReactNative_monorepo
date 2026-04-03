import React, { useCallback, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookIcon, CardsIcon, PlanetIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { TabRoute } from 'shared/types';
import type { Breakpoint } from 'shared/lib';
import { SIDEBAR_WIDTH } from 'shared/lib';

type SidebarProps = {
  /** Current active tab (from TabsAndRoutesContext) */
  selectedTab: TabRoute;
  /** Called when a tab button is pressed */
  onNavigate: (tab: TabRoute) => void;
  breakpoint: 'tablet' | 'desktop';
};

type TabItem = {
  name: TabRoute;
  icon: React.ComponentType<{ width: number; height: number; fill: string }>;
  /** i18n key for the label */
  labelKey: string;
};

const TABS: TabItem[] = [
  { name: TabRoute.MainTab,     icon: PlanetIcon, labelKey: 'core:tab.home' },
  { name: TabRoute.SpreadsTab,  icon: CardsIcon,  labelKey: 'core:tab.spreads' },
  { name: TabRoute.LibraryTab,  icon: BookIcon,   labelKey: 'core:tab.library' },
];

export function WebSidebarNav({ selectedTab, onNavigate, breakpoint }: SidebarProps) {
  const { t } = useTranslation();
  const isDesktop = breakpoint === 'desktop';
  const sidebarW = SIDEBAR_WIDTH[breakpoint];
  const itemRefs = useRef<(any | null)[]>([]);

  // Arrow-key navigation between tab items
  const handleKeyDown = useCallback(
    (e: any, index: number) => {
      if (Platform.OS !== 'web') return;
      const key = e?.nativeEvent?.key ?? e?.key;
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        e?.preventDefault?.();
        const next = (index + 1) % TABS.length;
        itemRefs.current[next]?.focus?.();
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        e?.preventDefault?.();
        const prev = (index - 1 + TABS.length) % TABS.length;
        itemRefs.current[prev]?.focus?.();
      }
    },
    [],
  );

  return (
    <View
      style={[styles.sidebar, { width: sidebarW }]}
      // @ts-ignore – web-only aria landmark
      role="navigation"
      aria-label={t('core:nav.sidebar', { defaultValue: 'Main navigation' })}
    >
      {/* Logo mark */}
      <View style={styles.logoArea} accessibilityElementsHidden>
        <PlanetIcon width={28} height={28} fill={COLORS.Primary} />
      </View>

      {/* role="menubar" + orientation for screen-reader context */}
      <View
        style={styles.navItems}
        // @ts-ignore
        role="menubar"
        aria-orientation="vertical"
      >
        {TABS.map(({ name, icon: Icon, labelKey }, index) => {
          const isActive = selectedTab === name;
          const label = t(labelKey);
          return (
            <Pressable
              key={name}
              ref={(r) => { itemRefs.current[index] = r; }}
              style={({ pressed, hovered }: any) => [
                styles.navItem,
                isDesktop && styles.navItemDesktop,
                isActive && styles.navItemActive,
                Platform.OS === 'web' && hovered && !isActive && styles.navItemHovered,
                Platform.OS === 'web' && pressed && styles.navItemPressed,
              ]}
              onPress={() => onNavigate(name)}
              // @ts-ignore – web-only key handler forwarded to DOM element
              onKeyDown={(e: any) => handleKeyDown(e, index)}
              accessibilityRole="menuitem"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              // keyboard users can Tab to any item, then use Arrow keys
              tabIndex={isActive ? 0 : -1}
            >
              <Icon
                width={isDesktop ? 22 : 26}
                height={isDesktop ? 22 : 26}
                fill={isActive ? COLORS.Primary : COLORS.Content}
              />
              {isDesktop && (
                <Text
                  category={TEXT_TAGS.p2}
                  weight={isActive ? TEXT_WEIGHT.semiBold : TEXT_WEIGHT.regular}
                  style={[styles.label, isActive && styles.labelActive]}
                >
                  {label}
                </Text>
              )}
              {/* Active indicator stripe */}
              {isActive && <View style={[styles.activeStripe, isDesktop && styles.activeStripeDesktop]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: COLORS.Background2,
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(244,244,245,0.06)',
  },
  logoArea: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  navItems: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 8,
  },
  navItem: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navItemDesktop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(246,192,27,0.10)',
  },
  navItemHovered: {
    backgroundColor: 'rgba(244,244,245,0.06)',
  },
  navItemPressed: {
    backgroundColor: 'rgba(244,244,245,0.04)',
    ...(Platform.OS === 'web' ? ({ transform: [{ scale: 0.97 }] } as any) : {}),
  },
  label: {
    color: COLORS.Content,
    flex: 1,
  },
  labelActive: {
    color: COLORS.Primary,
  },
  activeStripe: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 3,
    backgroundColor: COLORS.Primary,
  },
  activeStripeDesktop: {
    top: 6,
    bottom: 6,
  },
});
