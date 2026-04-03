import { ScrollView, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { DeckStyle } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getImage, verticalScale } from 'shared/lib';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TabRoute,
} from 'shared/types';
import { ScreenLayout, TileCard } from 'shared/ui';

export default function SpreadsGroups() {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  const { spreadsTabs } = useData({
    Context: SpreadContext,
  });

  return (
    <ScreenLayout style={styles.wrapper}>
      <Header showBackButton={false} title={t('core:page.spreadsGroups')} />
      <ScrollView>
        <View style={styles.spreadsCards}>
          {spreadsTabs?.map((item) => (
            <TileCard
              imageSource={getImage([
                'spreadsCategories',
                DeckStyle.FlatIllustration,
                item.id,
              ])}
              onPress={async () => {
                AppMetrica.reportEvent(AnalyticAction.ClickSpreadsGroup, {
                  group: item.name,
                });

                navigation.navigate(TabRoute.MainTab, {
                  screen: NavigationRoute.Spreads,
                  params: {
                    id: item.id,
                  },
                });
              }}
              textStyles={styles.spreadNameStyle}
              key={item.id}
              height={verticalScale(200)}
              imagePosition={ImagePosition.Background}
            >
              {t(item.name)}
            </TileCard>
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
  wrapper: {
    paddingBottom: 48,
  },
  spreadsCards: {
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
