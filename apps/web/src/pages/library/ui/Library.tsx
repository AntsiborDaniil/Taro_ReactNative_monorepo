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
import { COLORS, getColorOpacity } from 'shared/themes';
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
          <Text
            category={TEXT_TAGS.p2}
            style={[
              styles.introLead,
              {
                fontSize: layout.libraryIntroFontSize,
                lineHeight: Math.round(layout.libraryIntroFontSize + 7),
                marginBottom: Math.round(layout.gap * 0.85),
              },
            ]}
          >
            {t('core:library.intro.lead')}
          </Text>
          <View
            style={[
              styles.gridShell,
              {
                padding: Math.max(12, layout.gridShellPadding + 2),
              },
            ]}
          >
            <View
              style={[
                styles.grid,
                layout.isStackedTiles && styles.gridStacked,
                {
                  gap: Math.max(12, layout.gap + 2),
                },
              ]}
            >
              {LIBRARY_PLATES.map((item, index) => (
                <CategoryCard
                  key={item.id}
                  card={item}
                  fullWidth={layout.isStackedTiles}
                  tileWidth={layout.cardWidths[index] ?? layout.cardWidth}
                  tileHeight={Math.max(
                    layout.cardHeight,
                    layout.isStackedTiles ? 148 : layout.cardHeight
                  )}
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
    paddingTop: 12,
    width: '100%',
  },
  introLead: {
    color: 'rgba(216, 228, 247, 0.86)',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
  },
  gridShell: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary500, 22),
    backgroundColor: 'rgba(30, 35, 43, 0.55)',
    overflow: 'visible',
    ...(globalThis?.window
      ? ({
          boxShadow:
            '0 16px 36px rgba(8, 12, 20, 0.38), inset 0 1px 0 rgba(246, 192, 27, 0.08)',
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
