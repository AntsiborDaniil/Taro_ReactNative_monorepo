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
          <View style={[styles.cardAccent, styles.cardAccentBuild]} />
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
          <View style={[styles.cardAccent, styles.cardAccentQuit]} />
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
    position: 'relative',
  },
  choiceCard: {
    backgroundColor: 'rgba(16, 24, 40, 0.94)',
    borderColor: 'rgba(170, 195, 232, 0.18)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    ...({
      cursor: 'pointer',
      transition: 'transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
    } as object),
  },
  choiceCardBuild: {
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(88, 196, 255, 0.85)',
  },
  choiceCardQuit: {
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 176, 108, 0.85)',
  },
  choiceCardHovered: {
    transform: [{ translateY: -2 }],
    borderColor: 'rgba(199, 182, 255, 0.4)',
    ...({
      boxShadow: '0 12px 24px rgba(0,0,0,0.22)',
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
    color: 'rgba(198, 211, 239, 0.78)',
    letterSpacing: 0.35,
  },
  text: {
    textAlign: 'left',
    color: COLORS.Content,
  },
  cardDescription: {
    color: COLORS.Content2,
    lineHeight: 22,
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
    borderColor: 'rgba(111, 204, 255, 0.42)',
    backgroundColor: 'rgba(70, 154, 255, 0.12)',
  },
  iconWrapperQuit: {
    borderColor: 'rgba(255, 183, 132, 0.42)',
    backgroundColor: 'rgba(255, 165, 71, 0.12)',
  },
  cardAccent: {
    position: 'absolute',
    width: 62,
    height: 2,
    left: 16,
    top: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardAccentBuild: {
    backgroundColor: 'rgba(85, 176, 255, 0.85)',
  },
  cardAccentQuit: {
    backgroundColor: 'rgba(255, 167, 95, 0.85)',
  },
});

export default HabitChoose;
