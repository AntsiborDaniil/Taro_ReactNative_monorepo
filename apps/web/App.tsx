import * as React from 'react';
import { useEffect, useState } from 'react';
import * as eva from '@eva-design/eva';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider } from '@ui-kitten/components';
import { useFonts } from 'expo-font';
import { TarotErrorBoundary } from 'pages/errorBoundary';
import ErrorBoundary from 'react-native-error-boundary';
import { LogBox, Platform, type ViewStyle } from 'react-native';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tarotNavigationTheme } from './src/app/navigation/navigationTheme';
import { appFontSources } from './src/shared/lib/web/appFonts';
import { COLORS, myTheme } from 'shared/themes';
import RootNavigator from './src/app/navigation/RootNavigator';
import { navigationRef } from './src/app/navigation/navigationRef';
import GlobalProvider from './src/app/providers/GlobalProvider/ui/GlobalProvider';
import { WebA11yRoot } from './src/app/providers/WebA11y';
import { WebTypographyRoot } from './src/app/providers/WebTypography';
import {
  ApplicationConfigContext,
  useApplicationConfig,
} from './src/entities/ApplicationConfig';
import { UserContext, WebUserSessionProvider } from './src/entities/user';
import AnimatedSplashScreen from './src/features/splash/ui/AnimatedSplashScreen';
import { SubscriptionType } from './src/shared/api';
import { LoadingsContext, useLoadings } from './src/shared/contexts/Loadings';
import { DataProvider } from './src/shared/DataProvider';
import { AIAnimation, TarotToast } from './src/shared/ui';

import './i18n';

if (__DEV__ && Platform.OS === 'web') {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const firstArg = args[0];
    const message = typeof firstArg === 'string' ? firstArg : '';

    if (message.includes('Accessing element.ref was removed in React 19')) {
      return;
    }

    originalConsoleError(...args);
  };

  LogBox.ignoreLogs([
    'Accessing element.ref was removed in React 19',
    'props.pointerEvents is deprecated. Use style.pointerEvents',
    'Unknown event handler property `onStartShouldSetResponder`',
    'Unknown event handler property `onResponderTerminationRequest`',
    'Unknown event handler property `onResponderGrant`',
    'Unknown event handler property `onResponderMove`',
    'Unknown event handler property `onResponderRelease`',
    'Unknown event handler property `onResponderTerminate`',
    'TouchableMixin is deprecated. Please use Pressable.',
  ]);

  configureReanimatedLogger({
    level: ReanimatedLogLevel.error,
    strict: false,
  });
}

const appShellStyle: ViewStyle = {
  flex: 1,
  backgroundColor: COLORS.Background,
};

export default function RootLayout() {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

  const loadingsContextData = useLoadings();
  const applicationConfigContextData = useApplicationConfig();

  const [interLoaded, interError] = useFonts(appFontSources);

  const isResourcesLoading = !interLoaded && !interError;

  useEffect(() => {
    if (isResourcesLoading) return;

    const holdMs = Platform.OS === 'web' ? 0 : 500;
    const timeout = setTimeout(() => {
      setIsAppLoading(false);
    }, holdMs);

    return () => clearTimeout(timeout);
  }, [isResourcesLoading]);

  if (isAppLoading) {
    return (
      <SafeAreaProvider style={appShellStyle}>
        <AnimatedSplashScreen isLoading={isResourcesLoading} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={appShellStyle}>
      <ApplicationProvider {...eva} theme={{ ...eva.dark, ...myTheme }}>
        <DataProvider Context={LoadingsContext} value={loadingsContextData}>
          <NavigationContainer
            ref={navigationRef}
            theme={tarotNavigationTheme}
          >
            {Platform.OS === 'web' ? (
              <>
                <WebA11yRoot />
                <WebTypographyRoot />
              </>
            ) : null}
            <ErrorBoundary FallbackComponent={TarotErrorBoundary}>
              {Platform.OS === 'web' ? (
                <WebUserSessionProvider>
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
                </WebUserSessionProvider>
              ) : (
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
              )}
            </ErrorBoundary>
            {Platform.OS === 'web' ? <TarotToast /> : null}
          </NavigationContainer>
        </DataProvider>
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}
