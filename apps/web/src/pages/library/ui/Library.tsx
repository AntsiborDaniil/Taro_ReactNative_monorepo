import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { CategoryCard } from 'features';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { LEGAL_ENTITY } from 'shared/config/legal';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon, SettingsIcon } from 'shared/icons';
import { isTablet, WEB_HOVER_TRANSITION } from 'shared/lib';
import { AnalyticAction, NavigationRoute, PressableWebState } from 'shared/types';
import { DS_COLORS, DS_SIZES, dsRadius } from 'shared/themes/ds';
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
                fill={DS_COLORS.ink50}
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

          <View style={styles.legalFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings:legal.title')}
              onPress={() => navigation.navigate(NavigationRoute.Legal as never)}
              style={(state: PressableWebState) => [
                styles.legalButton,
                (state.hovered || state.pressed) && styles.legalButtonActive,
              ]}
            >
              <Text
                category={TEXT_TAGS.p2}
                weight={TEXT_WEIGHT.medium}
                style={styles.legalButtonText}
              >
                {t('settings:legal.title')}
              </Text>
            </Pressable>
            <Text category={TEXT_TAGS.label} style={styles.legalCopy}>
              {`© ${new Date().getFullYear()} ${LEGAL_ENTITY.brand} · ${t('settings:legal.badge.age')}`}
            </Text>
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
    color: DS_COLORS.ink100,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
  },
  gridShell: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    overflow: 'visible',
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
    minHeight: DS_SIZES.listRowHeight,
    borderRadius: dsRadius.listRow,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
    position: 'relative',
    ...WEB_HOVER_TRANSITION,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  settingsRowActive: {
    backgroundColor: DS_COLORS.pressDim,
    borderColor: DS_COLORS.accent400,
  },
  settingsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS_COLORS.ground600,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  settingsTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingsTitle: {
    color: DS_COLORS.ink50,
  },
  settingsHint: {
    color: DS_COLORS.ink100,
    lineHeight: 18,
  },
  legalFooter: {
    width: '100%',
    marginTop: 18,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DS_COLORS.ground600,
    gap: 8,
    alignItems: 'center',
  },
  legalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer', ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  legalButtonActive: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.pressDim,
  },
  legalButtonText: {
    color: DS_COLORS.ink50,
  },
  legalCopy: {
    color: DS_COLORS.ink100,
  },
});

export default Library;
