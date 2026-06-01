import { ReactNode, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type DeferredMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  /** Delay before mounting children (ms). */
  delayMs?: number;
};

/**
 * Yields first paint, then mounts heavy subtree (helps slow devices / networks).
 */
export function DeferredMount({
  children,
  fallback,
  delayMs = 48,
}: DeferredMountProps) {
  const [ready, setReady] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const id = window.setTimeout(() => setReady(true), delayMs);
      return () => window.clearTimeout(id);
    }

    const id = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  if (!ready) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
