import {
  StatusBar,
  StyleProp,
  StyleSheet,
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
          <View style={[styles.decorOrb, styles.decorOrbTop]} />
          <View style={[styles.decorOrb, styles.decorOrbBottom]} />
          <View style={styles.decorGrid} />
        </View>
        <Layout
          style={StyleSheet.flatten([
            styles.layout,
            {
              ...insets,
              paddingBottom: insets.bottom,
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
    width: 260,
    height: 260,
    top: -140,
    right: -70,
    backgroundColor: 'rgba(117, 96, 224, 0.16)',
  },
  decorOrbBottom: {
    width: 220,
    height: 220,
    left: -90,
    bottom: -110,
    backgroundColor: 'rgba(75, 139, 228, 0.13)',
  },
  decorGrid: {
    position: 'absolute',
    width: 120,
    height: 120,
    right: 30,
    bottom: 36,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.12)',
    backgroundColor: 'rgba(170, 148, 250, 0.025)',
  },
});

export default ScreenLayout;
