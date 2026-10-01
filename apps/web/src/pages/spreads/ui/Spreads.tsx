import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import { tryNavigateNavReturn, useNavReturn } from 'app/navigation/navReturnStore';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import {
  blurActiveElement,
  getImage,
  shouldPromptWebSignIn,
  toastWebAuthRequired,
} from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout } from 'shared/ui';
import { DS_COLORS, dsText } from 'shared/themes/ds';

import SpreadCatalogCard from './SpreadCatalogCard';
import SpreadsEmptyState from './SpreadsEmptyState';
import { useContainerWidth, useSpreadsLayout } from './useSpreadsLayout';

export default function Spreads() {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, onContainerLayout] = useContainerWidth(windowWidth);
  const layout = useSpreadsLayout(containerWidth);

  const { isAuthenticated, authSessionLoading, refreshAuthSession } = useData({
    Context: UserContext,
  });
  const { selectSpread, spreadsSections } = useData({
    Context: SpreadContext,
  });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();

  const navigation = useNativeNavigation();
  const spreadsNavigatorTab = TabRoute.SpreadsTab;
  const navReturn = useNavReturn();

  const onFabScroll = useMobileFabScrollOnScroll();

  const lockedLabel = t('spread:catalog.locked');

  return (
    <ScreenLayout style={{ backgroundColor: DS_COLORS.ground900 }}>
      <Header
        showBackButton={navReturn != null}
        backAction={
          navReturn
            ? () => {
                tryNavigateNavReturn(navigation);
              }
            : undefined
        }
        title={t('core:page.spreadsGroups')}
        leadingTitle
        stylesWrapper={{
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
        }}
      />
      <View style={styles.measureFill} onLayout={onContainerLayout}>
        <ScrollView
          onScroll={onFabScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollInner,
            { paddingBottom: layout.scrollBottomPad },
          ]}
        >
          <View
            style={[
              styles.column,
              {
                maxWidth: layout.contentMaxWidth,
                paddingHorizontal: layout.gutter,
                paddingTop: layout.gutter,
                gap: layout.sectionGap,
              },
            ]}
          >
            {!spreadsSections?.length ? (
              <SpreadsEmptyState
                title={t('spread:catalog.empty.title')}
                actionLabel={t('spread:catalog.empty.action')}
                onAction={() => {
                  navigation.navigate(TabRoute.MainTab, {
                    screen: NavigationRoute.Main,
                  });
                }}
              />
            ) : (
              spreadsSections.map((section) => (
                <View
                  key={section.title}
                  style={[styles.section, { gap: layout.headingGap }]}
                >
                  <Text
                    accessibilityRole="header"
                    numberOfLines={2}
                    style={dsText('title', DS_COLORS.ink50)}
                  >
                    {t(section.title)}
                  </Text>

                  <View style={[styles.grid, { gap: layout.tileGap }]}>
                    {section.data.map((item) => (
                      <SpreadCatalogCard
                        key={item.id}
                        name={t(item.name)}
                        cardsLabel={t('spread:catalog.count', {
                          count: item.cardsCount,
                        })}
                        lockedLabel={lockedLabel}
                        imageSource={getImage([
                          'spreads',
                          DeckStyle.FlatIllustration,
                          item.id,
                        ])}
                        width={layout.tileWidth}
                        isLocked={false}
                        onPress={async () => {
                          AppMetrica.reportEvent(
                            AnalyticAction.ClickSpreadInCategory,
                            {
                              spread: item.name,
                              isLocked: false,
                            }
                          );

                          blurActiveElement();
                          await handleVibrationClick?.();

                          if (
                            shouldPromptWebSignIn(
                              isAuthenticated,
                              authSessionLoading
                            )
                          ) {
                            void refreshAuthSession?.();
                            toastWebAuthRequired();
                            return;
                          }

                          const { shouldRedirectToSpreadReading } =
                            (await selectSpread?.(item)) || {};

                          if (shouldRedirectToSpreadReading) {
                            navigation.navigate(spreadsNavigatorTab, {
                              screen: NavigationRoute.SpreadReadings,
                            });
                            return;
                          }

                          navigation.navigate(spreadsNavigatorTab, {
                            screen: NavigationRoute.SpreadDescriptionChoice,
                          });
                        }}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  measureFill: {
    flex: 1,
    width: '100%',
  },
  scrollInner: {
    flexGrow: 1,
  },
  column: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  section: {
    width: '100%',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
