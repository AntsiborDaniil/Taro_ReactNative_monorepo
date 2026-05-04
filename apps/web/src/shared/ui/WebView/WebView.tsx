import { Platform, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

type WebViewScreen = {
  customUrl?: string;
};

function WebViewScreen({ customUrl }: WebViewScreen) {
  const route = useRoute<RouteProp<{ params: { url: string } }, 'params'>>();
  const uri = customUrl ?? route.params.url;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webRoot}>
        {/* react-native-webview не поддерживает web — встраиваем документ через iframe */}
        <iframe
          title="Legal document"
          src={uri}
          style={iframeStyle}
        />
      </View>
    );
  }

  return (
    <View style={styles.nativeRoot}>
      <WebView source={{ uri }} />
    </View>
  );
}

const iframeStyle: Record<string, string | number> = {
  border: 'none',
  width: '100%',
  height: '100%',
  minHeight: '72vh',
  flex: 1,
};

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: '#171F2C',
  },
  nativeRoot: {
    flex: 1,
  },
});

export default WebViewScreen;
