import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { CategoryCard } from 'features';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon, SettingsIcon } from 'shared/icons';
import { isTablet, WEB_HOVER_TRANSITION } from 'shared/lib';
import { AnalyticAction, NavigationRoute, PressableWebState } from 'shared/types';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
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

    navigation.push(NavigationRoute.Settings as never);
  };

  const iconSize = isTablet ? 26 : 22;

  return (
    <ScreenLayout>
      <Header
        showBackButton={false}
        title={t('core:library')}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings:settings')}
            onPress={handlePress}
            style={(state: PressableWebState) => [
              styles.settingsRow,
              (state.hovered || state.pressed) && styles.settingsRowActive,
            ]}
          >
            <View style={styles.settingsIconWrap}>
              <SettingsIcon
                width={iconSize}
                height={iconSize}
                fill={COLORS.Content}
              />
            </View>
            <View style={styles.settingsTextCol}>
              <Text
                category={TEXT_TAGS.h4}
                weight={TEXT_WEIGHT.medium}
                style={styles.settingsTitle}
              >
                {t('settings:settings')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.settingsHint}>
                {t('core:library.settings.subtitle')}
              </Text>
            </View>
            <ChevronRightIcon width={isTablet ? 26 : 17} height={isTablet ? 26 : 17} />
          </Pressable>
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
  settingsRow: {
    marginTop: 20,
    marginBottom: 8,
    width: '100%',
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.16)',
    backgroundColor: COLORS.Background2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
    position: 'relative',
    ...WEB_HOVER_TRANSITION,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          boxShadow:
            '0 10px 32px rgba(8, 12, 20, 0.35), inset 0 1px 0 rgba(246, 192, 27, 0.05)',
        } as object)
      : {}),
  },
  settingsRowActive: {
    backgroundColor: 'rgba(100, 152, 202, 0.12)',
    borderColor: 'rgba(246, 192, 27, 0.28)',
  },
  settingsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 192, 27, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.22)',
  },
  settingsTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingsTitle: {
    color: COLORS.Content,
  },
  settingsHint: {
    color: COLORS.SpbSky1,
    lineHeight: 18,
  },
});

export default Library;
