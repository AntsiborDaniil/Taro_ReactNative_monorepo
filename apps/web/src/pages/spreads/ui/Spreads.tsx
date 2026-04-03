import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { getImage, verticalScale, getBreakpoint, SIDEBAR_WIDTH, SHELL_MAX_WIDTH } from 'shared/lib';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
} from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TileCard } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

const PADDING = 16;
const GAP = 16;

export default function Spreads() {
  const { showModal } = useData({ Context: ModalsContext });
  const { subscriptionType } = useData({ Context: UserContext });
  const { selectSpread, spreadsSections } = useData({ Context: SpreadContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const { t } = useTranslation();
  const navigation = useNativeNavigation();

  const { width: winWidth } = useWindowDimensions();
  const bp = getBreakpoint(winWidth);
  const sidebarW = bp === 'mobile' ? 0 : SIDEBAR_WIDTH[bp];
  const shellW = Math.min(winWidth, SHELL_MAX_WIDTH[bp]);
  const contentW = shellW - sidebarW - PADDING * 2;

  // Scale columns by available content width for a balanced grid
  const cols = contentW >= 1200 ? 4 : contentW >= 700 ? 3 : contentW >= 400 ? 2 : 1;
  const cardW = (contentW - GAP * (cols - 1)) / cols;
  const cardH = verticalScale(bp === 'mobile' ? 200 : 180);

  return (
    <ScreenLayout>
      <Header showBackButton={false} title={t('core:page.spreadsGroups')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.spreads}>
          {!!spreadsSections?.length &&
            spreadsSections.map((data) => (
              <View style={styles.spreads} key={data.title}>
                <Text category={TEXT_TAGS.h3}>{t(data.title)}</Text>

                <View style={[styles.grid, { gap: GAP }]}>
                  {data.data.map((item) => {
                    const isLocked = !item.availableSubscriptions.some(
                      (sub) => sub === subscriptionType
                    );

                    return (
                      <TileCard
                        imageSource={getImage(['spreads', DeckStyle.FlatIllustration, item.id])}
                        isLocked={isLocked}
                        onPress={async () => {
                          AppMetrica.reportEvent(AnalyticAction.ClickSpreadInCategory, {
                            spread: item.name,
                            isLocked,
                          });
                          await handleVibrationClick?.();

                          if (isLocked) {
                            showModal?.(<PaidContent />);
                            return;
                          }

                          const { shouldRedirectToSpreadReading } =
                            (await selectSpread?.(item)) || {};

                          navigation.navigate(
                            (shouldRedirectToSpreadReading
                              ? NavigationRoute.SpreadReadings
                              : NavigationRoute.SpreadDescriptionChoice) as any
                          );
                        }}
                        imageResizeMode="cover"
                        textStyles={styles.spreadNameStyle}
                        key={item.id}
                        height={cardH}
                        width={cardW}
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
  scrollContent: {
    paddingBottom: 32,
  },
  spreads: {
    gap: 16,
    padding: PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
