import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Кросс-платформенно: на web `AccessibilityInfo.isReduceMotionEnabled` читает
 * `prefers-reduced-motion` (см. react-native-web/dist/exports/AccessibilityInfo).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) {
          setReduced(Boolean(value));
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (value: boolean) => setReduced(Boolean(value))
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
