import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { CategoryCard } from 'features';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { StarsPro } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_WEIGHT } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { LIBRARY_PLATES } from '../lib';
import SubscriptionsBanner from './SubscriptionsBanner';

function Library() {
  const { t } = useTranslation();

  const { isPractitioner } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();

  const handlePress = async () => {
    AppMetrica.reportEvent(AnalyticAction.ClickSettings);

    await handleVibrationClick?.();

    navigation.navigate(TabRoute.LibraryTab, {
      screen: NavigationRoute.Settings,
    });
  };

  return (
    <ScreenLayout style={styles.wrapper}>
      <Header
        leftContent={
          isPractitioner ? (
            <TouchableOpacity
              onPress={() => showModal?.(<PaidContent />)}
              style={styles.proWrapper}
            >
              <StarsPro width={20} height={20} />
              <Text style={styles.pro} weight={TEXT_WEIGHT.bold}>
                PRO
              </Text>
            </TouchableOpacity>
          ) : null
        }
        showBackButton={false}
        title={t('core:library')}
        rightAction={handlePress}
      />
      {!isPractitioner && <SubscriptionsBanner />}
      <FlatList
        data={LIBRARY_PLATES}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View>
            <CategoryCard card={item} />
          </View>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  listContainer: {
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  proWrapper: {
    display: 'flex',
    position: 'absolute',
    zIndex: 20,
    flexDirection: 'row',
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: COLORS.Primary,
  },
  pro: {
    color: COLORS.Background,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
});

export default Library;
