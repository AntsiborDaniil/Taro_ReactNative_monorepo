import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { useLibraryLayout } from './useLibraryLayout';

function Library() {
  const { t } = useTranslation();
  const layout = useLibraryLayout();

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
    <ScreenLayout>
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
      <ScrollView
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: layout.scrollBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.column,
            {
              width: layout.contentWidth,
              maxWidth: '100%',
              alignSelf: 'center',
              paddingHorizontal: layout.padding,
              gap: layout.gap + 4,
            },
          ]}
        >
          {!isPractitioner && <SubscriptionsBanner layout={layout} />}
          <View
            style={[
              styles.grid,
              {
                gap: layout.gap,
                justifyContent: layout.gridJustifyContent,
              },
            ]}
          >
            {LIBRARY_PLATES.map((item) => (
              <CategoryCard
                key={item.id}
                card={item}
                tileWidth={layout.cardWidth}
                tileHeight={layout.cardHeight}
                cornerImageWidth={layout.cornerImageWidth}
                cornerImageHeight={layout.cornerImageHeight}
                titleFontSize={layout.cardTitleFontSize}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    flexGrow: 1,
  },
  column: {
    paddingTop: 8,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
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
    fontSize: 22,
  },
});

export default Library;
