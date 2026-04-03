import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { getImage, horizontalScale, verticalScale } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

function SubscriptionsBanner() {
  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={async () => {
        AppMetrica.reportEvent(AnalyticAction.ClickPaidContent);

        await handleVibrationClick?.();

        showModal?.(<PaidContent />);
      }}
      style={styles.banner}
    >
      <LinearGradient
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0.2, y: 0.8 }}
        style={styles.gradient}
        colors={['#023549', '#001c27']}
      >
        <View style={styles.paidContentInnerTexts}>
          <Text category={TEXT_TAGS.h3} style={styles.title}>
            {t('subscriptions:banner:title')}
          </Text>
          <Text style={styles.action}>{t('subscriptions:banner.action')}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image style={styles.image} source={getImage(['core', 'paidGirl'])} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  action: {
    padding: 8,
    borderRadius: 16,
    color: COLORS.Primary,
    backgroundColor: getColorOpacity(COLORS.Background2, 60),
  },
  imageContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignSelf: 'flex-end',
  },
  title: {
    color: COLORS.Content,
  },
  image: {
    resizeMode: 'contain',
    width: horizontalScale(120),
    height: verticalScale(200),
  },
  banner: {
    backgroundColor: COLORS.Background2,
    borderRadius: 16,
    height: verticalScale(160),
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'space-between',
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
  },
  paidContentInnerTexts: {
    position: 'absolute',
    zIndex: 3,
    height: '100%',
    top: 16,
    left: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});

export default SubscriptionsBanner;
