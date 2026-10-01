import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { GetIcon, QuitIcon } from 'shared/icons';
import { getImage, WEB_HOVER_TRANSITION } from 'shared/lib';
import { DS_COLORS, dsWebTransition } from 'shared/themes/ds';
import {
  HabitType,
  NavigationRoute,
  PressableWebState,
  TabRoute,
} from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

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
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroStage}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={getImage(['core', 'paidGirl'])}
          />
        </View>

        <View style={styles.copyBlock}>
          <Text category={TEXT_TAGS.label} style={styles.eyebrow}>
            {t('habits:choose.eyebrow')}
          </Text>
          <Text
            category={TEXT_TAGS.h2}
            weight={TEXT_WEIGHT.medium}
            style={styles.pageTitle}
          >
            {t('habits:choose.title')}
          </Text>
          <Text category={TEXT_TAGS.p2} style={styles.pageSubtitle}>
            {t('habits:choose.subtitle')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('habits:button.chooseBad')}
          onPress={() => openHabitCreate(HabitType.BuildPositive)}
          style={(state: PressableWebState) => {
            const { hovered, pressed } = state;
            return [
              styles.choiceCard,
              hovered && styles.choiceCardHovered,
              pressed && styles.choiceCardPressed,
            ];
          }}
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.caption} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.build')}
            </Text>
            <View style={styles.iconWrapper}>
              <GetIcon style={styles.icon} />
            </View>
          </View>
          <Text style={styles.text} category={TEXT_TAGS.h4} weight={TEXT_WEIGHT.medium}>
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
          style={(state: PressableWebState) => {
            const { hovered, pressed } = state;
            return [
              styles.choiceCard,
              hovered && styles.choiceCardHovered,
              pressed && styles.choiceCardPressed,
            ];
          }}
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.caption} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.quit')}
            </Text>
            <View style={styles.iconWrapper}>
              <QuitIcon style={styles.icon} />
            </View>
          </View>
          <Text style={styles.text} category={TEXT_TAGS.h4} weight={TEXT_WEIGHT.medium}>
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
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  content: {
    gap: 14,
    paddingBottom: 40,
  },
  heroStage: {
    height: 210,
    marginHorizontal: -4,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: DS_COLORS.ground800,
  },
  image: {
    height: 240,
    width: '78%',
    maxWidth: 280,
    marginBottom: -28,
  },
  copyBlock: {
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: DS_COLORS.accent400,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: DS_COLORS.ink50,
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  choiceCard: {
    backgroundColor: DS_COLORS.ground700,
    borderColor: DS_COLORS.ground600,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    ...dsWebTransition,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer', ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  choiceCardHovered: {
    borderColor: DS_COLORS.accent400,
  },
  choiceCardPressed: Platform.select({
    web: { transform: [{ translateY: 1 }] } as object,
    default: { opacity: 0.96 },
  }),
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: DS_COLORS.ink100,
  },
  text: {
    textAlign: 'left',
    color: DS_COLORS.ink50,
    letterSpacing: 0.2,
  },
  cardDescription: {
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  icon: {
    width: 56,
    height: 56,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
  },
});

export default HabitChoose;
