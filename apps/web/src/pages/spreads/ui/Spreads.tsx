import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { blurActiveElement, getImage, isGuestFreeSpreadId } from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

import SpreadCatalogCard from './SpreadCatalogCard';
import { useSpreadsLayout } from './useSpreadsLayout';

export default function Spreads() {
  const layout = useSpreadsLayout();

  const { showModal } = useData({ Context: ModalsContext });
  const { subscriptionType, isAuthenticated } = useData({ Context: UserContext });
  const { selectSpread, spreadsSections } = useData({
    Context: SpreadContext,
  });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();
  const { t: tSpread } = useTranslation('spread');

  const navigation = useNativeNavigation();

  const showWebGuestBanner = Platform.OS === 'web' && !isAuthenticated;

  return (
    <ScreenLayout>
      <Header
        showBackButton={false}
        title={t('core:page.spreadsGroups')}
        titleStyle={layout.columns === 1 ? spreadsHeaderTitle.mobile : undefined}
      />
      <ScrollView
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
          {showWebGuestBanner && (
            <LinearGradient
              colors={[
                getColorOpacity(COLORS.Primary, 0.35),
                getColorOpacity('#4A7AE8', 0.22),
                getColorOpacity(COLORS.Background2, 0.08),
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.guestBanner}
            >
              <Text category={TEXT_TAGS.p2} style={styles.guestBannerText}>
                {tSpread('guestCatalog.banner')}
              </Text>
            </LinearGradient>
          )}
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
                    const isLocked = !item.availableSubscriptions.some(
                      (subscriptionItem) =>
                        subscriptionItem === subscriptionType
                    );

                    const guestFree = isGuestFreeSpreadId(item.id);
                    const guestBadge =
                      Platform.OS === 'web' && !isAuthenticated && guestFree;

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
                        isLocked={isLocked}
                        guestNoAuthBadge={guestBadge}
                        width={layout.cardWidth}
                        imageAreaHeight={layout.previewHeight}
                        onPress={async () => {
                          AppMetrica.reportEvent(
                            AnalyticAction.ClickSpreadInCategory,
                            {
                              spread: item.name,
                              isLocked,
                            }
                          );

                          blurActiveElement();
                          await handleVibrationClick?.();

                          if (isLocked) {
                            showModal?.(<PaidContent />);
                            return;
                          }

                          if (
                            Platform.OS === 'web' &&
                            !isAuthenticated &&
                            !guestFree
                          ) {
                            showModal?.(<SignInForSpreadsModal />);
                            return;
                          }

                          const { shouldRedirectToSpreadReading } =
                            (await selectSpread?.(item)) || {};

                          if (shouldRedirectToSpreadReading) {
                            navigation.navigate(TabRoute.MainTab, {
                              screen: NavigationRoute.SpreadReadings,
                            });
                            return;
                          }

                          navigation.navigate(TabRoute.MainTab, {
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

const spreadsHeaderTitle = {
  /** чуть меньше дефолтного h3 (~21), только одна колонка */
  mobile: { fontSize: 22 },
};

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
    width: 140,
    height: 140,
    left: -56,
    bottom: -16,
    backgroundColor: 'rgba(58, 122, 216, 0.12)',
  },
  guestBanner: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.SpbSky1, 0.45),
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 1,
    ...(globalThis?.window
      ? ({
          boxShadow: '0 8px 24px rgba(10, 20, 40, 0.28)',
        } as object)
      : {}),
  },
  guestBannerText: {
    color: '#EEF3FF',
    letterSpacing: 0.2,
    lineHeight: 22,
    textAlign: 'center',
  },
});
