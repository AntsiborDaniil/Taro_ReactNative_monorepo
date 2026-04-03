import { FlatList, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
import { getBreakpoint, SHELL_MAX_WIDTH, SIDEBAR_WIDTH } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_WEIGHT } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { LIBRARY_PLATES } from '../lib';
import SubscriptionsBanner from './SubscriptionsBanner';

const CARD_GAP = 16;
const CARD_PADDING = 16;

function Library() {
  const { t } = useTranslation();

  const { isPractitioner } = useData({ Context: UserContext });
  const { showModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });
  const navigation = useNativeNavigation();

  const { width: winWidth } = useWindowDimensions();
  const bp = getBreakpoint(winWidth);
  const sidebarW = bp === 'mobile' ? 0 : SIDEBAR_WIDTH[bp];
  const shellW = Math.min(winWidth, SHELL_MAX_WIDTH[bp]);
  const contentW = shellW - sidebarW - CARD_PADDING * 2;

  // Scale columns by actual content area width
  const cols = contentW >= 1200 ? 4 : contentW >= 700 ? 3 : 2;
  const cardW = (contentW - CARD_GAP * (cols - 1)) / cols;

  const handlePress = async () => {
    AppMetrica.reportEvent(AnalyticAction.ClickSettings);
    await handleVibrationClick?.();
    navigation.navigate(TabRoute.LibraryTab, { screen: NavigationRoute.Settings });
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
        numColumns={cols}
        key={`cols-${cols}`}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={[styles.row, { gap: CARD_GAP }]}
        renderItem={({ item }) => (
          <CategoryCard card={item} cardWidth={cardW} />
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  proWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.Primary,
    gap: 2,
  },
  pro: {
    color: COLORS.Background,
  },
  row: {
    marginBottom: 16,
  },
});

export default Library;
