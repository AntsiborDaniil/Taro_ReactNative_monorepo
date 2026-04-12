import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

import type { LibraryLayout } from './useLibraryLayout';

type SubscriptionsBannerProps = {
  layout: LibraryLayout;
};

function SubscriptionsBanner({ layout }: SubscriptionsBannerProps) {
  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={async () => {
        AppMetrica.reportEvent(AnalyticAction.ClickPaidContent);

        await handleVibrationClick?.();

        showModal?.(<PaidContent />);
      }}
      style={[
        styles.banner,
        {
          minHeight: layout.bannerHeight,
          borderRadius: layout.bannerBorderRadius,
        },
      ]}
    >
      <LinearGradient
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0.85, y: 0.65 }}
        style={[
          styles.gradient,
          {
            flex: 1,
            width: '100%',
            minHeight: layout.bannerHeight,
            borderRadius: layout.bannerBorderRadius,
            paddingHorizontal: layout.bannerPadding,
            paddingVertical: layout.bannerPadding,
          },
        ]}
        colors={['#06354a', '#001a24']}
      >
        <View style={styles.row}>
          <View style={styles.textColumn}>
            <Text
              category={TEXT_TAGS.h3}
              style={[
                styles.title,
                { fontSize: layout.bannerTitleFontSize },
              ]}
            >
              {t('subscriptions:banner:title')}
            </Text>
            <Text style={styles.action} category={TEXT_TAGS.label}>
              {t('subscriptions:banner.action')}
            </Text>
          </View>
          <View
            style={[
              styles.imageColumn,
              { maxHeight: layout.bannerImageMaxHeight },
            ]}
          >
            <Image
              style={{
                width: layout.bannerImageWidth,
                height: Math.min(
                  layout.bannerImageHeight,
                  layout.bannerImageMaxHeight
                ),
                maxHeight: layout.bannerImageMaxHeight,
              }}
              resizeMode="contain"
              source={getImage(['core', 'paidGirl'])}
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.Background2,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  gradient: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    width: '100%',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 12,
    paddingRight: 4,
  },
  imageColumn: {
    flexShrink: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  title: {
    color: COLORS.Content,
  },
  action: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    overflow: 'hidden',
    fontSize: 22,
    color: COLORS.Primary,
    backgroundColor: getColorOpacity(COLORS.Background2, 72),
  },
});

export default SubscriptionsBanner;
