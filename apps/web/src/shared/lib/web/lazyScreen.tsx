import {
  ComponentType,
  lazy,
  type ReactNode,
  Suspense,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS } from 'shared/themes';
import { PageSkeleton } from 'shared/ui/Skeleton';

type LazyScreenOptions = {
  fallback?: ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

function LazyScreenFallback({ children }: { children: ReactNode }) {
  return <View style={styles.fallback}>{children}</View>;
}

/**
 * Code-split screen for web; eager component on native.
 */
export function createLazyScreen(
  loader: () => Promise<{ default: AnyComponent }>,
  eager: AnyComponent,
  options: LazyScreenOptions = {}
): AnyComponent {
  if (Platform.OS !== 'web') {
    return eager;
  }

  const LazyComponent = lazy(loader);
  const fallback = (
    <LazyScreenFallback>
      {options.fallback ?? <PageSkeleton />}
    </LazyScreenFallback>
  );

  const LazyScreen: AnyComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyScreen.displayName = `Lazy(${eager.displayName ?? eager.name ?? 'Screen'})`;

  return LazyScreen;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: COLORS.Background,
  },
});
