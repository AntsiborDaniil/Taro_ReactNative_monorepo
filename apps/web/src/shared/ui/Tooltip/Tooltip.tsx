import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import TooltipBase, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { COLORS } from '../../themes';

type AnchorRect = {
  top: number;
  right: number;
};

type Props = TooltipProps & {
  parentWrapperStyle?: StyleProp<ViewStyle>;
};

const TOOLTIP_Z_INDEX = 10000;

const Tooltip = ({
  children,
  content,
  contentStyle,
  parentWrapperStyle,
  ...rest
}: Props) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [openedByPress, setOpenedByPress] = useState<boolean>(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<View>(null);

  const closeTooltip = useCallback(() => {
    setIsVisible(false);
    setOpenedByPress(false);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    let node = document.getElementById('tarot-tooltip-portal');
    if (!node) {
      node = document.createElement('div');
      node.id = 'tarot-tooltip-portal';
      document.body.appendChild(node);
    }

    setPortalRoot(node);
  }, []);

  const updateAnchorRect = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width) => {
      setAnchorRect({
        top: y,
        right: x + width,
      });
    });
  }, []);

  const openTooltip = useCallback(() => {
    updateAnchorRect();
    setIsVisible(true);
  }, [updateAnchorRect]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isVisible) {
      return;
    }

    updateAnchorRect();

    const handleLayoutChange = () => updateAnchorRect();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [isVisible, updateAnchorRect]);

  if (Platform.OS === 'web') {
    const tooltipBottom =
      typeof window !== 'undefined' && anchorRect
        ? window.innerHeight - anchorRect.top + 8
        : undefined;

    const tooltipRight =
      typeof window !== 'undefined' && anchorRect
        ? Math.max(16, window.innerWidth - anchorRect.right)
        : undefined;

    return (
      <>
        <View
          ref={anchorRef}
          style={[styles.webAnchor, parentWrapperStyle]}
          // @ts-expect-error RN Web hover events
          onMouseEnter={() => {
            if (!openedByPress) {
              openTooltip();
            }
          }}
          onMouseLeave={() => {
            if (!openedByPress) {
              closeTooltip();
            }
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (isVisible && openedByPress) {
                closeTooltip();
                return;
              }
              openTooltip();
              setOpenedByPress(true);
            }}
            style={({ pressed }) => [
              styles.webTrigger,
              pressed && styles.webTriggerPressed,
            ]}
          >
            {children}
          </Pressable>
        </View>
        {isVisible &&
          content &&
          portalRoot &&
          anchorRect &&
          createPortal(
            <>
              {openedByPress ? (
                <Pressable
                  style={styles.webBackdrop}
                  onPress={closeTooltip}
                  accessibilityRole="button"
                />
              ) : null}
              <View
                style={[
                  styles.content,
                  styles.webContent,
                  contentStyle,
                  {
                    bottom: tooltipBottom,
                    right: tooltipRight,
                    maxWidth:
                      typeof window !== 'undefined'
                        ? Math.min(320, window.innerWidth - 32)
                        : 320,
                  },
                ]}
                // @ts-expect-error RN Web hover events
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => {
                  if (!openedByPress) {
                    closeTooltip();
                  }
                }}
              >
                {content}
              </View>
            </>,
            portalRoot
          )}
      </>
    );
  }

  return (
    <TooltipBase
      {...rest}
      content={content}
      contentStyle={[styles.content, contentStyle]}
      isVisible={isVisible}
      arrowSize={{ width: 0, height: 0 }}
      onClose={() => setIsVisible(false)}
      parentWrapperStyle={parentWrapperStyle}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setIsVisible(true);
        }}
      >
        {children}
      </TouchableOpacity>
    </TooltipBase>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.Background,
    borderRadius: 16,
    padding: 12,
  },
  webAnchor: {
    position: 'relative',
  },
  webTrigger: {
    cursor: 'pointer',
  },
  webTriggerPressed: {
    opacity: 0.7,
  },
  webBackdrop: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: TOOLTIP_Z_INDEX - 1,
  },
  webContent: {
    position: 'fixed',
    zIndex: TOOLTIP_Z_INDEX,
    minWidth: 220,
    maxWidth: 320,
    // @ts-expect-error RN Web supports boxShadow
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
  },
});

export default Tooltip;
