import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function readSlowConnection(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return false;
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;

  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  const type = connection.effectiveType ?? '';
  return type === 'slow-2g' || type === '2g' || type === '3g';
}

export function useSlowConnection(): boolean {
  const [isSlow, setIsSlow] = useState(readSlowConnection);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
      return;
    }

    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;

    if (!connection?.addEventListener) {
      return;
    }

    const onChange = () => setIsSlow(readSlowConnection());
    connection.addEventListener('change', onChange);
    return () => connection.removeEventListener?.('change', onChange);
  }, []);

  return isSlow;
}
