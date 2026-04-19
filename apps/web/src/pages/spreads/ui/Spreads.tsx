import { ScrollView, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { blurActiveElement, getImage } from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

import SpreadCatalogCard from './SpreadCatalogCard';
import { useSpreadsLayout } from './useSpreadsLayout';

export default function Spreads() {
  const layout = useSpreadsLayout();

  const { showModal } = useData({ Context: ModalsContext });
  const { subscriptionType } = useData({ Context: UserContext });
  const { selectSpread, spreadsSections } = useData({
    Context: SpreadContext,
  });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  return (
    <ScreenLayout>
      <Header
        showBackButton={true}
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
          {!!spreadsSections?.length &&
            spreadsSections.map((data) => (
              <View style={{ gap: layout.gap - 2 }} key={data.title}>
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
  },
  sectionTitle: {
    marginBottom: 4,
    letterSpacing: 0.15,
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
});
