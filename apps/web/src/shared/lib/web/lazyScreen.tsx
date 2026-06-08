import {
  ComponentType,
  lazy,
  useEffect,
  useState,
  type ReactNode,
  Suspense,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ensureI18nNamespaces } from 'shared/lib/i18n/loadNamespaces';
import { COLORS } from 'shared/themes';
import { PageSkeleton } from 'shared/ui/Skeleton';

type LazyScreenOptions = {
  fallback?: ReactNode;
  /** Dynamic i18n chunks (e.g. card ~23 MB) loaded before the screen module. */
  i18nNamespaces?: readonly string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

function LazyScreenFallback({ children }: { children: ReactNode }) {
  return <View style={styles.fallback}>{children}</View>;
}

function withI18nGate(
  Component: AnyComponent,
  namespaces: string[],
  fallback: ReactNode
): AnyComponent {
  const GatedScreen: AnyComponent = (props) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      void ensureI18nNamespaces(...namespaces).then(() => setReady(true));
    }, []);

    if (!ready) {
      return <>{fallback}</>;
    }

    return <Component {...props} />;
  };

  GatedScreen.displayName = `I18nGate(${Component.displayName ?? Component.name ?? 'Screen'})`;
  return GatedScreen;
}

/**
 * Code-split screen for web; eager component on native (optional i18n gate on both).
 */
export function createLazyScreen(
  loader: () => Promise<{ default: AnyComponent }>,
  eager: AnyComponent,
  options: LazyScreenOptions = {}
): AnyComponent {
  const fallback = (
    <LazyScreenFallback>
      {options.fallback ?? <PageSkeleton />}
    </LazyScreenFallback>
  );
  const i18nNamespaces = options.i18nNamespaces ?? [];

  if (Platform.OS !== 'web') {
    if (i18nNamespaces.length === 0) {
      return eager;
    }
    return withI18nGate(eager, i18nNamespaces, fallback);
  }

  const LazyComponent = lazy(async () => {
    if (i18nNamespaces.length > 0) {
      await ensureI18nNamespaces(...i18nNamespaces);
    }
    return loader();
  });

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
