import { ScrollView, StyleSheet, View } from 'react-native';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { CategoryCard } from 'features';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { LIBRARY_PLATES } from '../lib';
import { useLibraryLayout } from './useLibraryLayout';

function Library() {
  const { t } = useTranslation();
  const layout = useLibraryLayout();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();

  const onFabScroll = useMobileFabScrollOnScroll();

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
        showBackButton={false}
        title={t('core:library')}
        rightAction={handlePress}
      />
      <ScrollView
        onScroll={onFabScroll}
        scrollEventThrottle={16}
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
              width: '100%',
              alignSelf: 'center',
              paddingHorizontal: layout.padding,
            },
          ]}
        >
          {layout.hasTabRail ? (
            <Text
              category={TEXT_TAGS.p2}
              style={[
                styles.introLead,
                {
                  fontSize: layout.libraryIntroFontSize,
                  lineHeight: Math.round(layout.libraryIntroFontSize + 7),
                },
              ]}
            >
              {t('core:library.intro.lead')}
            </Text>
          ) : null}
          {layout.hasTabRail &&
          Boolean(t('core:library.section.subtitle').trim()) ? (
            <View
              style={{
                marginTop: Math.round(layout.gap * 0.65),
              }}
            >
              <Text
                category={TEXT_TAGS.p2}
                style={[
                  styles.sectionSubtitle,
                  {
                    fontSize: layout.libraryIntroFontSize,
                    lineHeight: Math.round(layout.libraryIntroFontSize + 7),
                  },
                ]}
              >
                {t('core:library.section.subtitle')}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.gridShell,
              {
                marginTop: Math.round(layout.gap * 0.45),
                padding: layout.gridShellPadding,
              },
            ]}
          >
            <View
              style={[
                styles.grid,
                layout.isStackedTiles && styles.gridStacked,
                {
                  gap: layout.gap,
                },
              ]}
            >
              {LIBRARY_PLATES.map((item, index) => (
                <CategoryCard
                  key={item.id}
                  card={item}
                  fullWidth={layout.isStackedTiles}
                  tileWidth={layout.cardWidths[index] ?? layout.cardWidth}
                  tileHeight={layout.cardHeight}
                  cornerImageWidth={layout.cornerImageWidth}
                  cornerImageHeight={layout.cornerImageHeight}
                  titleFontSize={layout.cardTitleFontSize}
                  tileSubtitleFontSize={layout.libraryTileSubtitleFontSize}
                  tileSubtitleLineHeight={
                    layout.libraryTileSubtitleLineHeight
                  }
                  isTileTitleMidViewport={layout.isTileTitleMidViewport}
                />
              ))}
            </View>
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
    paddingTop: 4,
    width: '100%',
  },
  introLead: {
    color: 'rgba(216, 228, 247, 0.82)',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
  },
  sectionSubtitle: {
    marginTop: 6,
    color: 'rgba(216, 228, 247, 0.72)',
    maxWidth: 520,
    alignSelf: 'center',
    textAlign: 'center',
  },
  gridShell: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(141, 178, 235, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    overflow: 'hidden',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 10px 22px rgba(10, 15, 26, 0.2)',
        } as object)
      : {}),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  gridStacked: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
});

export default Library;
