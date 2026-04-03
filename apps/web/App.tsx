import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect, useState } from 'react';
import * as eva from '@eva-design/eva';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider } from '@ui-kitten/components';
import { useFonts } from 'expo-font';
import { TarotErrorBoundary } from 'pages/errorBoundary';
import ErrorBoundary from 'react-native-error-boundary';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, myTheme } from 'shared/themes';
import { getBreakpoint, SHELL_MAX_WIDTH } from 'shared/lib';

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

// Inject global CSS for the web shell and UI polish.
// Must run after all imports so the module system has initialised.
if (Platform.OS === 'web') {
  try {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* ── Shell ───────────────────────────────────────────── */
      html, body {
        background-color: #0A0F18;
        height: 100%;
        overflow: hidden;
      }
      #root {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
      }

      /* ── Text selection ──────────────────────────────────── */
      ::selection {
        background: rgba(246, 192, 27, 0.28);
        color: #F4F4F5;
      }

      /* ── Scrollbars ──────────────────────────────────────── */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: rgba(244, 244, 245, 0.14);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(244, 244, 245, 0.28);
      }

      /* ── Focus rings ─────────────────────────────────────── */
      /* Hide focus ring for mouse/touch users only */
      :focus:not(:focus-visible) { outline: none !important; box-shadow: none !important; }

      /* Keyboard focus ring – gold glow on every interactive element */
      :focus-visible {
        outline: 2px solid rgba(246, 192, 27, 0.75) !important;
        outline-offset: 2px;
        border-radius: 10px;
        box-shadow: 0 0 0 4px rgba(246, 192, 27, 0.12) !important;
      }
      /* Tighter radius on pill-shaped buttons */
      [role="button"]:focus-visible,
      button:focus-visible {
        border-radius: 14px;
      }
      /* No ring on the outer app shell container */
      #root:focus-visible,
      [data-focusable="false"]:focus-visible { outline: none !important; box-shadow: none !important; }

      /* Skip-to-content link (rendered by SkipLink component) */
      .skip-link {
        position: absolute;
        top: -999px;
        left: 8px;
        z-index: 99999;
        padding: 8px 16px;
        background: #F6C01B;
        color: #0A0F18;
        font-weight: 700;
        border-radius: 8px;
        text-decoration: none;
        font-family: Montserrat, sans-serif;
        font-size: 14px;
        transition: top 0.1s;
      }
      .skip-link:focus { top: 8px; }

      /* ── Text inputs ─────────────────────────────────────── */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="search"],
      textarea {
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      input[type="text"]:focus,
      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="number"]:focus,
      input[type="search"]:focus,
      textarea:focus {
        outline: none;
        border-color: rgba(246, 192, 27, 0.6) !important;
        box-shadow: 0 0 0 3px rgba(246, 192, 27, 0.12);
      }

      /* ── Range / Slider ──────────────────────────────────── */
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        outline: none;
        cursor: pointer;
        padding: 0;
      }

      /* Filled-track via CSS custom props set by Slider.tsx */
      input.tarot-range {
        --fill: 0%;
        --track-fill: #F6C01B;
        --track-bg: #333A43;
      }

      /* Track – WebKit (with fill gradient) */
      input.tarot-range::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--track-fill) var(--fill),
          var(--track-bg) var(--fill)
        );
      }
      /* Track – generic WebKit fallback */
      input[type="range"]:not(.tarot-range)::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: #333A43;
      }
      /* Thumb – WebKit */
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #F6C01B;
        margin-top: -8px;
        box-shadow: 0 0 0 3px rgba(246, 192, 27, 0.18), 0 2px 6px rgba(0,0,0,0.4);
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        box-shadow: 0 0 0 5px rgba(246, 192, 27, 0.28), 0 2px 8px rgba(0,0,0,0.5);
        transform: scale(1.12);
      }
      input[type="range"]:active::-webkit-slider-thumb {
        transform: scale(1.2);
      }

      /* Track – Firefox */
      input[type="range"]::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: #333A43;
        border: none;
      }
      /* Progress fill – Firefox */
      input[type="range"]::-moz-range-progress {
        background: #F6C01B;
        height: 4px;
        border-radius: 2px;
      }
      /* Thumb – Firefox */
      input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #F6C01B;
        border: none;
        box-shadow: 0 0 0 3px rgba(246, 192, 27, 0.18), 0 2px 6px rgba(0,0,0,0.4);
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      input[type="range"]::-moz-range-thumb:hover {
        box-shadow: 0 0 0 5px rgba(246, 192, 27, 0.28);
      }

      /* ── Buttons — cursor pointer on web ─────────────────── */
      [role="button"], button { cursor: pointer; }
    `;
    document.head.appendChild(styleEl);

    // Skip-to-content link for keyboard users
    const skip = document.createElement('a');
    skip.href = '#main-content';
    skip.className = 'skip-link';
    skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  } catch (_) {}
}

export default function RootLayout() {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const { width: winWidth } = useWindowDimensions();
  const breakpoint = getBreakpoint(winWidth);
  const shellMaxWidth = SHELL_MAX_WIDTH[breakpoint];

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
    <SafeAreaProvider style={styles.safeArea}>
      <View
        style={[styles.appShell, { maxWidth: shellMaxWidth }]}
        // @ts-ignore – web-only aria landmark
        role="main"
        id="main-content"
        aria-label="Tarot App"
      >
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F18',
    alignItems: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    // maxWidth is applied dynamically from shellMaxWidth (430 / 900 / 1200)
    backgroundColor: COLORS.Background,
    overflow: 'hidden',
  },
});
