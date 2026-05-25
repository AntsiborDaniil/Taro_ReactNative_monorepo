import { useCallback, useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { ChevronRightIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { NavigationRoute, PressableWebState } from 'shared/types';
import { ScreenLayout } from '../ScreenLayout';
import { Text, TEXT_TAGS } from '../Text';

type WebViewScreen = {
  customUrl?: string;
};

function titleForRoute(
  name: string,
  t: (k: string) => string
): string {
  if (name === NavigationRoute.TermsOfUse) {
    return t('settings:terms.of.use');
  }
  if (name === NavigationRoute.PrivacyPolicy) {
    return t('settings:privacy.policy');
  }
  return t('settings:settings');
}

function WebViewScreen({ customUrl }: WebViewScreen) {
  const { t } = useTranslation();
  const route = useRoute();
  const routeName = route.name as string;
  const params = (route as { params?: { url: string } }).params;
  const uri = customUrl ?? params?.url ?? '';

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { sceneContentWidth } = useTabRailLayout();
  const frameWidth = useMemo(
    () => Math.min(900, Math.max(280, sceneContentWidth - 32)),
    [sceneContentWidth]
  );

  const pageTitle = useMemo(
    () => titleForRoute(routeName, t),
    [routeName, t]
  );

  const openInBrowser = useCallback(async () => {
    await handleVibrationClick?.();
    if (uri) {
      await Linking.openURL(uri);
    }
  }, [handleVibrationClick, uri]);

  if (Platform.OS === 'web') {
    return (
      <ScreenLayout style={styles.layoutRoot}>
        <View style={styles.headerZone}>
          <Header title={pageTitle} />
        </View>
        <View style={styles.webBody}>
          <View style={[styles.webFrame, { maxWidth: frameWidth }]}>
            <View style={styles.iframeChrome}>
              <iframe
                title={pageTitle}
                src={uri}
                style={iframeStyle}
              />
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={openInBrowser}
              style={(state: PressableWebState) => {
                const { hovered, pressed } = state;
                return [
                styles.openRow,
                (hovered || pressed) && styles.openRowActive,
              ];
              }}
            >
              <View style={styles.openRowText}>
                <Text category={TEXT_TAGS.h4} style={styles.openRowTitle}>
                  {t('settings:legal.open.newTab')}
                </Text>
                <Text category={TEXT_TAGS.p2} style={styles.openRowHint}>
                  {t('settings:legal.open.newTab.hint')}
                </Text>
              </View>
              <ChevronRightIcon
                width={20}
                height={20}
                style={styles.openRowChevron}
              />
            </Pressable>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={styles.layoutRoot}>
      <View style={styles.headerZone}>
        <Header title={pageTitle} />
      </View>
      <View style={styles.nativeFrame}>
        <WebView
          source={{ uri }}
          style={styles.nativeWebView}
        />
      </View>
    </ScreenLayout>
  );
}

const iframeStyle: Record<string, string | number> = {
  border: 'none',
  width: '100%',
  height: '100%',
  minHeight: 400,
  display: 'block',
  backgroundColor: COLORS.Content,
  borderRadius: 12,
};

const styles = StyleSheet.create({
  layoutRoot: {
    flex: 1,
  },
  headerZone: {
    width: '100%',
    zIndex: 2,
    backgroundColor: COLORS.Background,
  },
  webBody: {
    flex: 1,
    minHeight: 0,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  webFrame: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    gap: 12,
  },
  iframeChrome: {
    flex: 1,
    minHeight: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.22)',
    backgroundColor: COLORS.Background2,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.04)',
        } as object)
      : {}),
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.15)',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const } as object)
      : {}),
  },
  openRowActive: {
    backgroundColor: 'rgba(100, 152, 202, 0.14)',
    borderColor: 'rgba(246, 192, 27, 0.35)',
  },
  openRowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingRight: 12,
  },
  openRowTitle: {
    color: COLORS.Content,
  },
  openRowHint: {
    color: COLORS.SpbSky1,
    lineHeight: 18,
  },
  openRowChevron: {
    opacity: 0.9,
  },
  nativeFrame: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.2)',
  },
  nativeWebView: {
    flex: 1,
    backgroundColor: COLORS.Background2,
  },
});

export default WebViewScreen;
