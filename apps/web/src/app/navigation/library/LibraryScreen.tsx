import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext, useSpread } from 'entities/Spread';
import { CardsDictionary } from 'pages/cardsDictionary';
import { DetailCard } from 'pages/detailCard';
import { FavoriteCards } from 'pages/favoriteCards';
import { Library } from 'pages/library';
import { DeckStyle, Language, Settings, Sound } from 'pages/settings';
import { SpreadReadings } from 'pages/spreadReadings';
import { SpreadsHistory } from 'pages/spreadsHistory';
import { useTranslation } from 'react-i18next';
import { DataProvider, MultiProvider, useData } from 'shared/DataProvider';
import { NavigationRoute } from 'shared/types';
import { WebView } from 'shared/ui';

const LibraryStack = createNativeStackNavigator();

function LibraryScreen() {
  const { i18n } = useTranslation();

  const { spread } = useData({ Context: ApplicationConfigContext });

  const spreadContextData = useSpread({
    hasReversedCards: spread?.hasReversed,
  });

  return (
    <MultiProvider
      providers={[
        <DataProvider
          Context={SpreadContext}
          value={spreadContextData}
          key="ApplicationConfigContext"
        />,
      ]}
    >
      <LibraryStack.Navigator
        initialRouteName={NavigationRoute.Library}
        screenOptions={{ headerShown: false }}
      >
        <LibraryStack.Screen
          name={NavigationRoute.Library}
          component={Library}
        />
        <LibraryStack.Screen
          name={NavigationRoute.CardsDictionary}
          component={CardsDictionary}
        />
        <LibraryStack.Screen
          name={NavigationRoute.SpreadDetailCard}
          component={DetailCard}
        />
        <LibraryStack.Screen
          name={NavigationRoute.FavoriteCards}
          component={FavoriteCards}
        />
        <LibraryStack.Screen
          name={NavigationRoute.Settings}
          component={Settings}
        />
        <LibraryStack.Screen
          name={NavigationRoute.Language}
          component={Language}
        />
        <LibraryStack.Screen
          name={NavigationRoute.SpreadsHistory}
          component={SpreadsHistory}
        />
        <LibraryStack.Screen
          name={NavigationRoute.SpreadReadings}
          component={SpreadReadings}
        />
        <LibraryStack.Screen
          name={NavigationRoute.DeckStyle}
          component={DeckStyle}
        />
        <LibraryStack.Screen name={NavigationRoute.Sound} component={Sound} />
        <LibraryStack.Screen
          name={NavigationRoute.TermsOfUse}
          component={WebView}
          initialParams={{
            url: `https://sanmarinotech.github.io/tarot-legal/terms_${i18n.language}.html`,
          }}
        />
        <LibraryStack.Screen
          name={NavigationRoute.PrivacyPolicy}
          component={WebView}
          initialParams={{
            url: `https://sanmarinotech.github.io/tarot-legal/privacy_${i18n.language}.html`,
          }}
        />
      </LibraryStack.Navigator>
    </MultiProvider>
  );
}

export default LibraryScreen;
