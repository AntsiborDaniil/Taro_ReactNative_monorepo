import {
  Platform,
  StatusBar,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Layout } from '@ui-kitten/components';
import type { CSSProperties, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../themes';

type ScreenLayoutProps = {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
};

function ScreenLayout({ children, style }: ScreenLayoutProps): ReactNode {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isWide = width > 1280;

  const topOrbSize = isCompact ? 190 : isWide ? 300 : 260;
  const bottomOrbSize = isCompact ? 150 : isWide ? 250 : 220;
  const decorGridSize = isCompact ? 84 : isWide ? 140 : 120;
  const hideDecorGrid = width < 620;

  return (
    <>
      <View style={styles.bar}>
        <StatusBar
          backgroundColor={COLORS.Background}
          barStyle="light-content"
        />
      </View>
      <View style={styles.wrapper}>
        <View pointerEvents="none" style={styles.decorLayer}>
          <View
            style={[
              styles.decorOrb,
              styles.decorOrbTop,
              {
                width: topOrbSize,
                height: topOrbSize,
                top: -Math.round(topOrbSize * 0.54),
                right: -Math.round(topOrbSize * 0.28),
              },
            ]}
          />
          <View
            style={[
              styles.decorOrb,
              styles.decorOrbBottom,
              {
                width: bottomOrbSize,
                height: bottomOrbSize,
                left: -Math.round(bottomOrbSize * 0.42),
                bottom: -Math.round(bottomOrbSize * 0.5),
              },
            ]}
          />
          {!hideDecorGrid && (
            <View
              style={[
                styles.decorGrid,
                {
                  width: decorGridSize,
                  height: decorGridSize,
                  right: isCompact ? 16 : 30,
                  bottom: isCompact ? 16 : 36,
                },
              ]}
            />
          )}
        </View>
        <Layout
          style={StyleSheet.flatten([
            styles.layout,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingTop: Math.max(insets.top, isCompact ? 6 : 8),
              paddingBottom: insets.bottom,
              gap: isCompact ? 12 : 16,
            },
            style as StyleProp<ViewStyle>,
          ])}
        >
          {children}
        </Layout>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 0,
  },
  wrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: COLORS.Background,
    overflow: 'hidden',
  },
  layout: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    height: '100%',
    paddingTop: 8,
    gap: 16,
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorOrbTop: {
    backgroundColor: 'rgba(117, 96, 224, 0.16)',
  },
  decorOrbBottom: {
    backgroundColor: 'rgba(75, 139, 228, 0.13)',
  },
  decorGrid: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.12)',
    backgroundColor: 'rgba(170, 148, 250, 0.025)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(1px)',
        } as object)
      : {}),
  },
});

export default ScreenLayout;
