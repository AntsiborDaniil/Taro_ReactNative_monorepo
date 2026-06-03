import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Chrome/Safari mobile UI (tab bar, toolbar) is not included in safe-area-context.
 * visualViewport gap ≈ obscured bottom area.
 */
export function useWebVisualViewportInsets(): { bottom: number } {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setBottom(0);
        return;
      }
      const obscured = window.innerHeight - vv.height - vv.offsetTop;
      setBottom(Math.max(0, Math.round(obscured)));
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { bottom };
}
