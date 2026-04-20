import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { GetIcon, QuitIcon } from 'shared/icons';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { HabitType, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

function HabitChoose() {
  const { t } = useTranslation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();

  const openHabitCreate = async (habitType: HabitType) => {
    await handleVibrationClick?.();

    navigation.navigate(TabRoute.MainTab, {
      screen: NavigationRoute.HabitCreate,
      params: {
        habitType,
      },
    });
  };

  return (
    <ScreenLayout>
      <Header showBackButton title="" />
      <ScrollView style={styles.wrapper} contentContainerStyle={styles.buttons}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={getImage(['core', 'paidGirl'])}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('habits:button.chooseBad')}
          onPress={() => openHabitCreate(HabitType.BuildPositive)}
          style={({ hovered, pressed }) => [
            styles.choiceCard,
            styles.choiceCardBuild,
            hovered && styles.choiceCardHovered,
            pressed && styles.choiceCardPressed,
          ]}
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.caption} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.build')}
            </Text>
            <View style={[styles.iconWrapper, styles.iconWrapperBuild]}>
              <GetIcon style={styles.icon} />
            </View>
          </View>
          <Text style={styles.text} category={TEXT_TAGS.h4}>
            {t('habits:button.chooseBad')}
          </Text>
          <Text category={TEXT_TAGS.p2} style={styles.cardDescription}>
            {t('habits:choose.card.buildDescription')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('habits:button.chooseGood')}
          onPress={() => openHabitCreate(HabitType.QuitNegative)}
          style={({ hovered, pressed }) => [
            styles.choiceCard,
            styles.choiceCardQuit,
            hovered && styles.choiceCardHovered,
            pressed && styles.choiceCardPressed,
          ]}
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.caption} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.quit')}
            </Text>
            <View style={[styles.iconWrapper, styles.iconWrapperQuit]}>
              <QuitIcon style={styles.icon} />
            </View>
          </View>
          <Text style={styles.text} category={TEXT_TAGS.h4}>
            {t('habits:button.chooseGood')}
          </Text>
          <Text category={TEXT_TAGS.p2} style={styles.cardDescription}>
            {t('habits:choose.card.quitDescription')}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 48,
  },
  buttons: {
    gap: 14,
    marginTop: 258,
    paddingBottom: 16,
  },
  choiceCard: {
    backgroundColor: COLORS.Background,
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...({
      cursor: 'pointer',
      transition: 'transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
    } as object),
  },
  choiceCardBuild: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(95, 197, 255, 0.9)',
  },
  choiceCardQuit: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 169, 95, 0.9)',
  },
  choiceCardHovered: {
    transform: [{ translateY: -2 }],
    ...({
      boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
    } as object),
  },
  choiceCardPressed: {
    transform: [{ translateY: 0 }],
    opacity: 0.96,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    color: COLORS.Content2,
    letterSpacing: 0.2,
  },
  text: {
    textAlign: 'left',
    color: COLORS.Content,
  },
  cardDescription: {
    color: COLORS.Content2,
    lineHeight: 24,
  },
  image: {
    position: 'absolute',
    height: 400,
    width: '100%',
    top: -330,
  },
  icon: {
    width: 60,
    height: 60,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconWrapperBuild: {
    borderColor: 'rgba(95, 197, 255, 0.45)',
    backgroundColor: 'rgba(70, 154, 255, 0.14)',
  },
  iconWrapperQuit: {
    borderColor: 'rgba(255, 169, 95, 0.45)',
    backgroundColor: 'rgba(255, 165, 71, 0.14)',
  },
});

export default HabitChoose;
