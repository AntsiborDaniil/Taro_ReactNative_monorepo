import { Platform, ScrollView, StyleSheet, View } from 'react-native';
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
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

import SpreadCatalogCard from './SpreadCatalogCard';
import { useSpreadsLayout } from './useSpreadsLayout';

export default function Spreads() {
  const layout = useSpreadsLayout();

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

  return (
    <ScreenLayout>
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
      />
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
            styles.spreads,
            {
              width: layout.contentWidth,
              alignSelf: 'center',
              paddingHorizontal: layout.padding,
              paddingTop: layout.padding,
              gap: layout.gap + 4,
            },
          ]}
        >
          <View style={[styles.decorOrb, styles.decorOrbTop]} />
          <View style={[styles.decorOrb, styles.decorOrbBottom]} />
          {!!spreadsSections?.length &&
            spreadsSections.map((data) => (
              <View
                style={[styles.sectionCard, { gap: layout.gap - 2 }]}
                key={data.title}
              >
                <Text
                  category={TEXT_TAGS.h4}
                  style={[
                    styles.sectionTitle,
                    {
                      fontSize: layout.sectionTitleSize,
                      lineHeight: layout.sectionTitleLine,
                    },
                  ]}
                >
                  {t(data.title)}
                </Text>

                <View
                  style={[
                    layout.columns > 1
                      ? styles.columnWrapper
                      : styles.flatListContainer,
                    { gap: layout.gap },
                  ]}
                >
                  {data.data.map((item) => {
                    return (
                      <SpreadCatalogCard
                        key={item.id}
                        layout={layout}
                        title={t(item.name)}
                        imageSource={getImage([
                          'spreads',
                          DeckStyle.FlatIllustration,
                          item.id,
                        ])}
                        isLocked={false}
                        width={layout.cardWidth}
                        imageAreaHeight={layout.previewHeight}
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
                    );
                  })}
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    flexGrow: 1,
  },
  spreads: {
    maxWidth: '100%',
    position: 'relative',
  },
  sectionTitle: {
    marginBottom: 8,
    letterSpacing: 0.15,
    color: '#F4F6FF',
  },
  flatListContainer: {
    width: '100%',
  },
  columnWrapper: {
    width: '100%',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(141, 178, 235, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    padding: 14,
    overflow: 'hidden',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 10px 22px rgba(10, 15, 26, 0.2)',
        } as object)
      : {}),
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: 0,
  },
  decorOrbTop: {
    width: 180,
    height: 180,
    top: -80,
    right: -48,
    backgroundColor: 'rgba(112, 87, 236, 0.14)',
  },
  decorOrbBottom: {
    width: 220,
    height: 220,
    bottom: 40,
    left: -90,
    backgroundColor: 'rgba(74, 122, 232, 0.1)',
  },
});
