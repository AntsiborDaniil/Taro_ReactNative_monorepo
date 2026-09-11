import { useSyncExternalStore } from 'react';
import { NavigationRoute, TabRoute } from 'shared/types';

export type NavReturnPoint = {
  tab: TabRoute;
  screen: NavigationRoute;
  params?: Record<string, unknown>;
};

type AnyNavigation = {
  navigate: (...args: never[]) => void;
  getParent?: () => AnyNavigation | undefined;
};

let current: NavReturnPoint | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function getRootNavigation(navigation: AnyNavigation): AnyNavigation {
  let currentNav = navigation;
  let parent = currentNav.getParent?.();
  while (parent) {
    currentNav = parent;
    parent = currentNav.getParent?.();
  }
  return currentNav;
}

export function getNavReturn(): NavReturnPoint | null {
  return current;
}

export function setNavReturn(point: NavReturnPoint | null): void {
  current = point;
  emit();
}

export function clearNavReturn(): void {
  if (current == null) {
    return;
  }
  current = null;
  emit();
}

/** Remember Main as origin when leaving the home tab into another flow. */
export function setNavReturnToMain(): void {
  setNavReturn({
    tab: TabRoute.MainTab,
    screen: NavigationRoute.Main,
  });
}

/**
 * Navigate back to the stored origin (e.g. Main after popular spreads).
 * Returns true when a return target was consumed.
 */
export function tryNavigateNavReturn(navigation: AnyNavigation): boolean {
  const point = current;
  if (!point) {
    return false;
  }

  current = null;
  emit();

  const root = getRootNavigation(navigation);
  // Cast: root tab navigator typing varies across call sites.
  (root.navigate as (name: string, params?: object) => void)(
    point.tab,
    point.params
      ? { screen: point.screen, params: point.params }
      : { screen: point.screen }
  );

  return true;
}

export function subscribeNavReturn(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNavReturn(): NavReturnPoint | null {
  return useSyncExternalStore(subscribeNavReturn, getNavReturn, () => null);
}
