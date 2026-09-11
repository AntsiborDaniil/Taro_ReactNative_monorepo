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
import { useWebViewportInsets } from 'shared/lib/web/useWebViewportInsets';
import { FantasyAtmosphere } from '../FantasyAtmosphere';
import { COLORS } from '../../themes';

type ScreenLayoutProps = {
  children: ReactNode;
  style?: CSSProperties | StyleProp<ViewStyle>;
};

function ScreenLayout({ children, style }: ScreenLayoutProps): ReactNode {
  const insets = useSafeAreaInsets();
  const viewportInsets = useWebViewportInsets();
  const layoutInsets =
    Platform.OS === 'web'
      ? {
          top: Math.max(insets.top, viewportInsets.top),
          bottom: Math.max(insets.bottom, viewportInsets.bottom),
          left: Math.max(insets.left, viewportInsets.left),
          right: Math.max(insets.right, viewportInsets.right),
        }
      : insets;
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  /** Web: no forced gap above Header — only real safe-area / Telegram inset. */
  const paddingTop =
    Platform.OS === 'web'
      ? layoutInsets.top
      : Math.max(layoutInsets.top, isCompact ? 6 : 8);

  return (
    <>
      <View style={styles.bar}>
        <StatusBar
          backgroundColor={COLORS.Background}
          barStyle="light-content"
        />
      </View>
      <View style={styles.wrapper}>
        <FantasyAtmosphere compact={isCompact} wide={width > 1280} />
        <Layout
          style={StyleSheet.flatten([
            styles.layout,
            {
              paddingLeft: layoutInsets.left,
              paddingRight: layoutInsets.right,
              paddingTop,
              paddingBottom: layoutInsets.bottom,
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
    position: 'relative',
  },
  layout: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    height: '100%',
    gap: 16,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1,
  },
});

export default ScreenLayout;
