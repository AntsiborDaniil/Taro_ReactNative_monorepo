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
import { getImage, isTablet, verticalScale, width } from 'shared/lib';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TabRoute,
} from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TileCard } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

const PADDING = 8;
const GAP = 16;

const cardWidth = isTablet
  ? (width - 2 * PADDING) / 2 - GAP
  : width - 4 * PADDING;

export default function Spreads() {
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
      <Header showBackButton={true} title={t('core:page.spreadsGroups')} />
      <ScrollView>
        <View style={styles.spreads}>
          {!!spreadsSections?.length &&
            spreadsSections.map((data) => (
              <View style={styles.spreads} key={data.title}>
                <Text category={TEXT_TAGS.h3}>{t(data.title)}</Text>

                <View
                  style={
                    isTablet ? styles.columnWrapper : styles.flatListContainer
                  }
                >
                  {data.data.map((item) => {
                    const isLocked = !item.availableSubscriptions.some(
                      (subscriptionItem) =>
                        subscriptionItem === subscriptionType
                    );

                    return (
                      <TileCard
                        imageSource={getImage([
                          'spreads',
                          DeckStyle.FlatIllustration,
                          item.id,
                        ])}
                        isLocked={isLocked}
                        onPress={async () => {
                          AppMetrica.reportEvent(
                            AnalyticAction.ClickSpreadInCategory,
                            {
                              spread: item.name,
                              isLocked,
                            }
                          );

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
                        imageResizeMode="cover"
                        textStyles={styles.spreadNameStyle}
                        key={item.id}
                        height={
                          isTablet ? verticalScale(150) : verticalScale(200)
                        }
                        width={cardWidth}
                        imagePosition={ImagePosition.Background}
                      >
                        {t(item.name)}
                      </TileCard>
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
  spreadNameStyle: {
    margin: 4,
  },
  spreads: {
    gap: 16,
    padding: PADDING,
    paddingBottom: 24,
  },
  flatListContainer: {
    gap: GAP,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GAP,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
