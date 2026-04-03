import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useData } from 'shared/DataProvider';
import { ModalsContext } from './ModalsContext';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])', '[role="button"]:not([disabled])',
].join(',');

function useFocusTrap(active: boolean) {
  const ref = useRef<any>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!active || Platform.OS !== 'web') return;

    // Save currently focused element so we can restore it on close
    previousFocus.current = document.activeElement;

    // Move focus into the dialog on open
    const container: HTMLElement | null = ref.current;
    if (container) {
      const first = container.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
      (first ?? container).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that was focused before the modal opened
      if (previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus();
      }
    };
  }, [active]);

  return ref;
}

/**
 * Web: Modal renders as a View overlay inside the React tree to preserve all
 * contexts (navigation, safe area, etc.). react-native Modal renders outside
 * the tree, breaking useNavigation() and other context hooks.
 */

class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[ModalErrorBoundary] crash in modal content:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Modal render error:</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function ModalContainer() {
  const { isModalVisible, modalContent } = useData({ Context: ModalsContext });
  const trapRef = useFocusTrap(!!isModalVisible && !!modalContent);

  if (!isModalVisible || !modalContent) {
    return null;
  }

  return (
    <View
      ref={trapRef}
      style={[StyleSheet.absoluteFill, styles.overlay]}
      pointerEvents="auto"
      // @ts-ignore – web-only aria dialog attributes
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <ModalErrorBoundary>{modalContent}</ModalErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorTitle: {
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 12,
  },
});

export default ModalContainer;
