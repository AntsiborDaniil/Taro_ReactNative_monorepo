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
    backgroundColor: COLORS.Background,
  },
  layout: {
    height: '100%',
    paddingTop: 8,
    gap: 16,
  },
});

export default ScreenLayout;
