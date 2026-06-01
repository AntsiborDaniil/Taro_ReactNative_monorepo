import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { NavigationRoute } from 'shared/types';
import {
  LazyAuth,
  LazyCardsDictionary,
  LazyDeckStyle,
  LazyDetailCard,
  LazyFavoriteCards,
  LazyLanguage,
  LazyLibrary,
  LazySettings,
  LazySound,
  LazySpreadReadings,
  LazySpreadsHistory,
  LazyWebView,
} from '../lazyScreens';

const LibraryStack = createNativeStackNavigator();

function LibraryScreen() {
  const { i18n } = useTranslation();

  return (
    <LibraryStack.Navigator
      initialRouteName={NavigationRoute.Library}
      screenOptions={{ headerShown: false }}
    >
      <LibraryStack.Screen
        name={NavigationRoute.Library}
        component={LazyLibrary}
      />
      <LibraryStack.Screen
        name={NavigationRoute.CardsDictionary}
        component={LazyCardsDictionary}
      />
      <LibraryStack.Screen
        name={NavigationRoute.SpreadDetailCard}
        component={LazyDetailCard}
      />
      <LibraryStack.Screen
        name={NavigationRoute.FavoriteCards}
        component={LazyFavoriteCards}
      />
      <LibraryStack.Screen
        name={NavigationRoute.Settings}
        component={LazySettings}
      />
      <LibraryStack.Screen
        name={NavigationRoute.Language}
        component={LazyLanguage}
      />
      <LibraryStack.Screen
        name={NavigationRoute.SpreadsHistory}
        component={LazySpreadsHistory}
      />
      <LibraryStack.Screen
        name={NavigationRoute.SpreadReadings}
        component={LazySpreadReadings}
      />
      <LibraryStack.Screen
        name={NavigationRoute.DeckStyle}
        component={LazyDeckStyle}
      />
      <LibraryStack.Screen name={NavigationRoute.Sound} component={LazySound} />
      <LibraryStack.Screen name={NavigationRoute.Auth} component={LazyAuth} />
      <LibraryStack.Screen
        name={NavigationRoute.TermsOfUse}
        component={LazyWebView}
        initialParams={{
          url: `https://sanmarinotech.github.io/tarot-legal/terms_${i18n.language}.html`,
        }}
      />
      <LibraryStack.Screen
        name={NavigationRoute.PrivacyPolicy}
        component={LazyWebView}
        initialParams={{
          url: `https://sanmarinotech.github.io/tarot-legal/privacy_${i18n.language}.html`,
        }}
      />
    </LibraryStack.Navigator>
  );
}

export default LibraryScreen;
