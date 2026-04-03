import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Spinner } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { TSpread } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { COLORS, getColorOpacity } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { NoContent, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { useSpreadsHistory } from '../model';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SpreadsGroups() {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  const { selectFullSpread } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { spreadsSections, loadMore, loading } = useSpreadsHistory();

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  return (
    <ScreenLayout style={styles.wrapper}>
      <Header title={t('core:page.spreadsHistory')} />
      {/*<ScrollView>*/}
      {spreadsSections.length ? (
        <SectionList
          sections={spreadsSections}
          keyExtractor={(item) => item.uid ?? ''}
          style={styles.spreads}
          renderSectionHeader={({ section: { title } }) => (
            <Text category={TEXT_TAGS.h3}>{title}</Text>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }: { item: TSpread }) => {
            const date = new Date(item.date ?? '');

            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const time = `${hours}:${minutes}`;

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.historyItem}
                onPress={async () => {
                  if (item.packKey) {
                    const packJson: string | null = await AsyncStorage.getItem(
                      item.packKey
                    );

                    const packAsArray = packJson
                      ? (JSON.parse(packJson) as TSpread[])
                      : [];

                    const memoryItem = packAsArray.find(
                      (memItem) => item.uid === memItem.uid
                    );

                    if (memoryItem) {
                      selectFullSpread?.(memoryItem);
                    } else {
                      selectFullSpread?.(item);
                    }
                  } else {
                    selectFullSpread?.(item);
                  }

                  await handleVibrationClick?.();

                  navigation.navigate(selectedTab as TabRoute, {
                    screen: NavigationRoute.SpreadReadings,
                  });
                }}
              >
                <View style={styles.historyItem_top}>
                  <Text category={TEXT_TAGS.h4}>{t(item.name)}</Text>
                  <Text category={TEXT_TAGS.h4}>{time}</Text>
                </View>
                {!!item.question?.length && (
                  <Text style={styles.question} category={TEXT_TAGS.label}>
                    {`${item.question}`}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <NoContent title={t('core:history.noSpreads')} />
      )}

      {loading && (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 8,
          }}
        >
          <Spinner />
        </View>
      )}

      {/*</ScrollView>*/}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 48,
  },
  spreads: {
    gap: 16,
    padding: 16,
    paddingBottom: 48,
  },
  historyItem: {
    backgroundColor: getColorOpacity(COLORS.Secondary, 48),
    borderRadius: 16,
    padding: 12,
  },
  historyItem_top: { justifyContent: 'space-between', flexDirection: 'row' },
  question: {
    color: COLORS.SpbSky1,
  },
});
