import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

type DeferredMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  delayMs?: number;
};

/**
 * Перенесено из apps/web/src/shared/lib/web/DeferredMount.tsx: отдать первый
 * кадр (скелет), затем примонтировать тяжёлое поддерево — не блокирует LCP.
 */
export function DeferredMount({ children, fallback, delayMs = 48 }: DeferredMountProps): ReactElement {
  const [ready, setReady] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;

    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setReady(true), { timeout: delayMs + 120 });
      return () => win.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  return <>{ready ? children : fallback}</>;
}
