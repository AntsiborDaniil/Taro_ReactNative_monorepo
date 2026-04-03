import { View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

type WebViewScreen = {
  customUrl?: string;
};

function WebViewScreen({ customUrl }: WebViewScreen) {
  const route = useRoute<RouteProp<{ params: { url: string } }, 'params'>>();
  const { url } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ uri: customUrl ?? url }} />
    </View>
  );
}

export default WebViewScreen;
