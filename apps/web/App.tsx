import * as React from 'react';
import { useEffect, useState } from 'react';
import * as eva from '@eva-design/eva';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider } from '@ui-kitten/components';
import { useFonts } from 'expo-font';
import { TarotErrorBoundary } from 'pages/errorBoundary';
import ErrorBoundary from 'react-native-error-boundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, myTheme } from 'shared/themes';
import RootNavigator from './src/app/navigation/RootNavigator';
import GlobalProvider from './src/app/providers/GlobalProvider/ui/GlobalProvider';
import {
  ApplicationConfigContext,
  useApplicationConfig,
} from './src/entities/ApplicationConfig';
import { UserContext } from './src/entities/user';
import AnimatedSplashScreen from './src/features/splash/ui/AnimatedSplashScreen';
import { SubscriptionType } from './src/shared/api';
import { LoadingsContext, useLoadings } from './src/shared/contexts/Loadings';
import { DataProvider } from './src/shared/DataProvider';
import { AIAnimation } from './src/shared/ui';

import './i18n';

export default function RootLayout() {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

  const loadingsContextData = useLoadings();
  const applicationConfigContextData = useApplicationConfig();

  const [interLoaded, interError] = useFonts({
    'Montserrat-Black': require('./assets/fonts/Montserrat-Black.ttf'),
    'Montserrat-BlackItalic': require('./assets/fonts/Montserrat-BlackItalic.ttf'),
    'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-BoldItalic': require('./assets/fonts/Montserrat-BoldItalic.ttf'),
    'Montserrat-ExtraBold': require('./assets/fonts/Montserrat-ExtraBold.ttf'),
    'Montserrat-ExtraBoldItalic': require('./assets/fonts/Montserrat-ExtraBoldItalic.ttf'),
    'Montserrat-ExtraLight': require('./assets/fonts/Montserrat-ExtraLight.ttf'),
    'Montserrat-ExtraLightItalic': require('./assets/fonts/Montserrat-ExtraLightItalic.ttf'),
    'Montserrat-Italic': require('./assets/fonts/Montserrat-Italic.ttf'),
    'Montserrat-Light': require('./assets/fonts/Montserrat-Light.ttf'),
    'Montserrat-LightItalic': require('./assets/fonts/Montserrat-LightItalic.ttf'),
    'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-MediumItalic': require('./assets/fonts/Montserrat-MediumItalic.ttf'),
    'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-SemiBoldItalic': require('./assets/fonts/Montserrat-SemiBoldItalic.ttf'),
    'Montserrat-Thin': require('./assets/fonts/Montserrat-Thin.ttf'),
    'Montserrat-ThinItalic': require('./assets/fonts/Montserrat-ThinItalic.ttf'),
  });

  const isResourcesLoading = !interLoaded && !interError;

  useEffect(() => {
    if (isResourcesLoading) return;

    const timeout = setTimeout(() => {
      setIsAppLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isResourcesLoading]);

  if (isAppLoading) {
    return <AnimatedSplashScreen isLoading={isResourcesLoading} />;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: COLORS.Background }}>
      <ApplicationProvider {...eva} theme={{ ...eva.dark, ...myTheme }}>
        <DataProvider Context={LoadingsContext} value={loadingsContextData}>
          <NavigationContainer>
            <ErrorBoundary FallbackComponent={TarotErrorBoundary}>
              <DataProvider
                Context={UserContext}
                value={{
                  customerInfo: null,
                  subscriptionType: SubscriptionType.Freemium,
                  setSubscriptionType: () => {},
                  isPractitioner: false,
                }}
                key="UserContext"
              >
                <DataProvider
                  Context={ApplicationConfigContext}
                  value={applicationConfigContextData}
                  key="ApplicationConfigContext"
                >
                  <GlobalProvider>
                    <RootNavigator />
                  </GlobalProvider>
                  <AIAnimation
                    hasVibration={applicationConfigContextData.sound?.vibration}
                  />
                </DataProvider>
              </DataProvider>
            </ErrorBoundary>
          </NavigationContainer>
        </DataProvider>
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}
