import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { GetIcon, QuitIcon } from 'shared/icons';
import { getImage, WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
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
          <View style={styles.heroGlow} />
          <Image
            style={styles.image}
            resizeMode="contain"
            source={getImage(['core', 'paidGirl'])}
          />
          <LinearGradient
            colors={[
              'transparent',
              getColorOpacity(COLORS.Background, 55),
              COLORS.Background,
            ]}
            style={styles.heroFade}
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
              styles.choiceCardBuild,
              hovered && styles.choiceCardBuildHovered,
              pressed && styles.choiceCardPressed,
            ];
          }}
        >
          <LinearGradient
            colors={[
              'rgba(246, 192, 27, 0.16)',
              'rgba(47, 186, 216, 0.06)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardWash}
          />
          <View style={[styles.cardAccent, styles.cardAccentBuild]} />
          <View style={styles.choiceHeader}>
            <Text style={[styles.caption, styles.captionBuild]} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.build')}
            </Text>
            <View style={[styles.iconWrapper, styles.iconWrapperBuild]}>
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
              styles.choiceCardQuit,
              hovered && styles.choiceCardQuitHovered,
              pressed && styles.choiceCardPressed,
            ];
          }}
        >
          <LinearGradient
            colors={[
              'rgba(255, 99, 127, 0.14)',
              'rgba(211, 159, 19, 0.05)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardWash}
          />
          <View style={[styles.cardAccent, styles.cardAccentQuit]} />
          <View style={styles.choiceHeader}>
            <Text style={[styles.caption, styles.captionQuit]} category={TEXT_TAGS.label}>
              {t('habits:choose.badge.quit')}
            </Text>
            <View style={[styles.iconWrapper, styles.iconWrapperQuit]}>
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
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: 10,
    backgroundColor: getColorOpacity(COLORS.Primary500, 12),
    ...(Platform.OS === 'web'
      ? ({ filter: 'blur(28px)' } as object)
      : {}),
  },
  image: {
    height: 240,
    width: '78%',
    maxWidth: 280,
    marginBottom: -28,
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
    top: '45%',
  },
  copyBlock: {
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: COLORS.Primary500,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: COLORS.Content,
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    color: getColorOpacity(COLORS.Content, 68),
    lineHeight: 22,
  },
  choiceCard: {
    backgroundColor: 'rgba(22, 28, 38, 0.92)',
    borderColor: getColorOpacity(COLORS.Primary500, 14),
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          boxShadow: '0 14px 32px rgba(8, 12, 20, 0.35)',
          ...WEB_HOVER_TRANSITION,
        } as object)
      : {}),
  },
  choiceCardBuild: {
    borderColor: 'rgba(246, 192, 27, 0.28)',
  },
  choiceCardQuit: {
    borderColor: 'rgba(255, 99, 127, 0.28)',
  },
  choiceCardBuildHovered: {
    borderColor: 'rgba(246, 192, 27, 0.55)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 18px 36px rgba(8, 12, 20, 0.42), 0 0 28px rgba(246, 192, 27, 0.12)',
          transform: [{ translateY: -2 }],
        } as object)
      : {}),
  },
  choiceCardQuitHovered: {
    borderColor: 'rgba(255, 99, 127, 0.5)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 18px 36px rgba(8, 12, 20, 0.42), 0 0 28px rgba(255, 99, 127, 0.12)',
          transform: [{ translateY: -2 }],
        } as object)
      : {}),
  },
  choiceCardPressed: {
    opacity: 0.96,
  },
  cardWash: {
    ...StyleSheet.absoluteFillObject,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  captionBuild: {
    color: COLORS.Primary300,
  },
  captionQuit: {
    color: COLORS.Danger400,
  },
  text: {
    textAlign: 'left',
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  cardDescription: {
    color: getColorOpacity(COLORS.Content, 68),
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
  },
  iconWrapperBuild: {
    borderColor: getColorOpacity(COLORS.Primary500, 45),
    backgroundColor: getColorOpacity(COLORS.Primary500, 12),
  },
  iconWrapperQuit: {
    borderColor: getColorOpacity(COLORS.Danger500, 42),
    backgroundColor: getColorOpacity(COLORS.Danger500, 12),
  },
  cardAccent: {
    position: 'absolute',
    width: 72,
    height: 3,
    left: 18,
    top: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardAccentBuild: {
    backgroundColor: COLORS.Primary500,
  },
  cardAccentQuit: {
    backgroundColor: COLORS.Danger500,
  },
});

export default HabitChoose;
