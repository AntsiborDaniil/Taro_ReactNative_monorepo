import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type SchemeFitContainerProps = {
  children: ReactNode;
};

function SchemeFitContainer({ children }: SchemeFitContainerProps) {
  const [hostWidth, setHostWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const scale = useMemo(() => {
    if (hostWidth < 1 || contentWidth < 1) {
      return 1;
    }
    return Math.min(1, hostWidth / contentWidth);
  }, [hostWidth, contentWidth]);

  const slotHeight = contentHeight > 0 ? Math.ceil(contentHeight * scale) : undefined;

  return (
    <View
      style={styles.host}
      onLayout={(event) => setHostWidth(event.nativeEvent.layout.width)}
    >
      <View style={[styles.slot, slotHeight != null ? { height: slotHeight } : null]}>
        <View
          style={[styles.scaled, { transform: [{ scale }] }]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width > 0) {
              setContentWidth(width);
            }
            if (height > 0) {
              setContentHeight(height);
            }
          }}
        >
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    width: '100%',
    overflow: 'visible',
  },
  slot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  scaled: {
    alignSelf: 'center',
  },
  content: {
    alignSelf: 'center',
    flexShrink: 0,
  },
});

export default SchemeFitContainer;
