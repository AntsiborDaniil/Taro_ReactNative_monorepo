import {
  Platform,
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

  // On web, safe-area insets are effectively 0 from the viewport edge,
  // but our app shell is already a constrained 430px container so we
  // skip the top inset padding that would otherwise look like dead space.
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 0 : insets.bottom;

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
          style={[
            styles.layout,
            { paddingTop: topPad + 8, paddingBottom: bottomPad },
            style as StyleProp<ViewStyle>,
          ]}
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
    overflow: 'hidden',
  },
  layout: {
    flex: 1,
    gap: 16,
    overflow: 'hidden',
  },
});

export default ScreenLayout;
