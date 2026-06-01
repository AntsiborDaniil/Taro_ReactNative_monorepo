import {
  ComponentType,
  lazy,
  ReactNode,
  Suspense,
} from 'react';
import { Platform } from 'react-native';
import { PageSkeleton } from 'shared/ui/Skeleton';

type LazyScreenOptions = {
  fallback?: ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

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
  const fallback = options.fallback ?? <PageSkeleton />;

  const LazyScreen: AnyComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyScreen.displayName = `Lazy(${eager.displayName ?? eager.name ?? 'Screen'})`;

  return LazyScreen;
}
