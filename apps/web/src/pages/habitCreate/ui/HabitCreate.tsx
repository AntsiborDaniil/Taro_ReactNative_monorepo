import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-native-date-picker';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorPicker, { HueSlider } from 'reanimated-color-picker';
import EmojiPicker from 'rn-emoji-keyboard';
import { Header } from 'features/header';
import { EmojiIcon } from 'shared/icons';
import { getLocalizedWeekdays, WEB_HOVER_TRANSITION } from 'shared/lib';
import { DS_COLORS, dsWebTransition } from 'shared/themes/ds';
import {
  HabitFrequency,
  HabitType,
  INegativeHabit,
  IPositiveHabit,
} from 'shared/types';
import {
  Button,
  Carousel,
  Input,
  ScreenLayout,
  SwitchElement,
  Text,
  TEXT_TAGS,
  TEXT_WEIGHT,
} from 'shared/ui';
import { useHabitCreate } from '../model';

const screen = Dimensions.get('screen');

function HabitCreate() {
  const { t, i18n } = useTranslation();
  const route = useRoute<any>();
  const { habitType } = route.params || {};
  const isBuildHabit = habitType === HabitType.BuildPositive;
  const pageTitle = isBuildHabit
    ? t('habits:page.habitCreateBuild')
    : t('habits:page.habitCreateQuit');

  const { bottom } = useSafeAreaInsets();

  const weekDays = getLocalizedWeekdays(i18n.language);
  const inputBaseProps = {
    selectionColor: DS_COLORS.accent400,
    cursorColor: DS_COLORS.accent400,
  } as const;

  const {
    currentColor,
    isEmojiOpen,
    habit,
    openedDatePicker,
    isOpenedDatePicker,
    setIsOpenedDatePicker,
    handleChangeHabit,
    handleToggleEmoji,
    habitGoal,
    handleChangeHabitGoal,
    handleColorChange,
    handleColorPick,
    handleChangeFrequency,
    handleConfirmDate,
    handleToggleFrequencyDays,
    handleClickFrequencyDays,
    handleToggleSwitchEndDate,
    handleOpenDatePicker,
    handleSubmit,
    handleToggleAutoFill,
  } = useHabitCreate({ habitType });

  const backgroundColorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: currentColor.value,
    };
  });

  return (
    <ScreenLayout>
      <Header showBackButton title={pageTitle} />
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={styles.container}
      >
        <View style={styles.introCard}>
          <Text category={TEXT_TAGS.label} style={styles.introEyebrow}>
            {isBuildHabit
              ? t('habits:choose.badge.build')
              : t('habits:choose.badge.quit')}
          </Text>
          <Text
            category={TEXT_TAGS.h4}
            weight={TEXT_WEIGHT.medium}
            style={styles.introTitle}
          >
            {isBuildHabit
              ? t('habits:createIntro.build.title')
              : t('habits:createIntro.quit.title')}
          </Text>
          <Text category={TEXT_TAGS.p2} style={styles.introDescription}>
            {isBuildHabit
              ? t('habits:createIntro.build.subtitle')
              : t('habits:createIntro.quit.subtitle')}
          </Text>
        </View>
        <View style={styles.shape}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                baseInputProps={{
                  ...inputBaseProps,
                  style: [{ maxWidth: screen.width - 168 }],
                  value: habit.title,
                  onChangeText: handleChangeHabit('title'),
                  placeholder: t('habits:placeholder.habitTitle'),
                }}
              />
              <Input
                baseInputProps={{
                  ...inputBaseProps,
                  style: [{ maxWidth: screen.width - 168 }],
                  value: habit.description,
                  onChangeText: handleChangeHabit('description'),
                  placeholder: t('habits:placeholder.habitDesc'),
                }}
              />
            </View>
            <Animated.View
              style={[styles.emojiBackground, backgroundColorStyle]}
            >
              <Button onPress={handleToggleEmoji} style={styles.emojiButton}>
                {habit.emoji ? (
                  <Text style={styles.emoji}>{habit.emoji}</Text>
                ) : (
                  <EmojiIcon />
                )}
              </Button>
            </Animated.View>
          </View>
          <ColorPicker
            value={habit.color}
            sliderThickness={25}
            thumbSize={24}
            thumbShape="circle"
            onChange={handleColorChange}
            onCompleteJS={handleColorPick}
            boundedThumb
            adaptSpectrum
          >
            <HueSlider style={styles.sliderStyle} />
          </ColorPicker>
        </View>
        {habitType === HabitType.BuildPositive && (
          <>
            <View style={styles.shape}>
                  <View style={styles.row}>
                <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                  {t('habits:title.goal')}
                </Text>
                <View style={[styles.row, { width: '50%' }]}>
                  <Input
                    baseInputProps={{
                      ...inputBaseProps,
                      style: [styles.goalInput],
                      value: habitGoal.amount
                        ? habitGoal.amount.toString()
                        : '',
                      onChangeText: handleChangeHabitGoal('amount'),
                      placeholder: t('habits:placeholder.goalTitle'),
                    }}
                  />
                  <Input
                    baseInputProps={{
                      ...inputBaseProps,
                      style: [styles.goalInput],
                      value: habitGoal.unit,
                      onChangeText: handleChangeHabitGoal('unit'),
                      placeholder: t('habits:placeholder.goalUnit'),
                    }}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.shape, { gap: 16 }]}>
                  <View style={styles.row}>
                <Button
                  style={[
                    styles.controlButton,
                    styles.radioButton,
                    (habit as IPositiveHabit).frequency !== HabitFrequency.Daily
                      ? styles.controlButtonActive
                      : null,
                  ]}
                  onPress={() => handleChangeFrequency(HabitFrequency.OneTime)}
                >
                  <Text
                    category={TEXT_TAGS.label}
                    weight={
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.OneTime
                        ? TEXT_WEIGHT.semibold
                        : undefined
                    }
                    style={[
                      styles.radioTextMuted,
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.OneTime
                        ? styles.radioText
                        : null,
                    ]}
                  >
                    {t('habits:button.frequencyOneTime')}
                  </Text>
                </Button>
                <Button
                  style={[
                    styles.controlButton,
                    styles.radioButton,
                    (habit as IPositiveHabit).frequency ===
                    HabitFrequency.Daily
                      ? styles.controlButtonActive
                      : null,
                  ]}
                  onPress={() => handleChangeFrequency(HabitFrequency.Daily)}
                >
                  <Text
                    category={TEXT_TAGS.label}
                    weight={
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.Daily
                        ? TEXT_WEIGHT.semibold
                        : undefined
                    }
                    style={[
                      styles.radioTextMuted,
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.Daily
                        ? styles.radioText
                        : null,
                    ]}
                  >
                    {t('habits:button.frequencyDaily')}
                  </Text>
                </Button>
              </View>
              {(habit as IPositiveHabit).frequency === HabitFrequency.Daily && (
                <>
                  <SwitchElement
                    value={(habit as IPositiveHabit).frequencyDays.length === 7}
                    name={t('habits:title.frequency')}
                    onValueChange={handleToggleFrequencyDays}
                  />
                  {(habit as IPositiveHabit).frequencyDays.length !== 7 && (
                    <Carousel
                      spaceBetween={8}
                      renderItemStyle={styles.daysCarouselItem}
                      style={styles.daysCarousel}
                      renderItem={({ item }) => (
                        <Button
                          style={[
                            styles.controlButton,
                            styles.dayButton,
                            (habit as IPositiveHabit).frequencyDays.includes(
                              item.index
                            )
                              ? styles.controlButtonActive
                              : null,
                          ]}
                          onPress={() => handleClickFrequencyDays(item.index)}
                        >
                          <Text
                            category={TEXT_TAGS.label}
                            weight={
                              (habit as IPositiveHabit).frequencyDays.includes(
                                item.index
                              )
                                ? TEXT_WEIGHT.semibold
                                : undefined
                            }
                            style={[
                              styles.radioTextMuted,
                              (habit as IPositiveHabit).frequencyDays.includes(
                                item.index
                              )
                                ? styles.radioText
                                : null,
                            ]}
                          >
                            {item.day}
                          </Text>
                        </Button>
                      )}
                      data={weekDays}
                    />
                  )}
                </>
              )}
            </View>
          </>
        )}
        {!!habit.startDate && (
          <View style={styles.shape}>
              <View style={styles.row}>
              <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                {t('habits:title.startDate')}
              </Text>
              <Button
                style={[styles.controlButton, { width: '50%' }]}
                onPress={() => handleOpenDatePicker('startDate')}
              >
                <Text style={styles.controlButtonText}>
                  {new Date(habit.startDate).toLocaleDateString()}
                </Text>
              </Button>
            </View>
          </View>
        )}
        {habitType === HabitType.QuitNegative && (
          <View style={styles.shape}>
              <SwitchElement
              value={(habit as INegativeHabit).isAutoFillEnabled}
              name={t('habits:title.autoFill')}
              onValueChange={handleToggleAutoFill}
            />
            <Text category={TEXT_TAGS.p2} style={styles.sectionDescription}>
              {t('habits:description.autoFill')}
            </Text>
          </View>
        )}
        <View style={styles.shape}>
          <SwitchElement
            value={!!habit.endDate}
            name={t('habits:title.endDate')}
            onValueChange={handleToggleSwitchEndDate}
          />
          {!!habit.endDate && (
            <Button
              style={styles.controlButton}
              onPress={() => handleOpenDatePicker('endDate')}
            >
              <Text style={styles.controlButtonText}>
                {new Date(habit.endDate).toLocaleDateString()}
              </Text>
            </Button>
          )}
        </View>
      </ScrollView>
      <Button
        disabled={!habit.title}
        style={[styles.button, { marginBottom: bottom + 16 }]}
        onPress={handleSubmit}
      >
        {t('habits:button.create')}
      </Button>
      <EmojiPicker
        open={isEmojiOpen}
        hideHeader
        onClose={handleToggleEmoji}
        onEmojiSelected={(emoji) => handleChangeHabit('emoji')(emoji.emoji)}
      />
      <DatePicker
        modal
        mode="date"
        minimumDate={
          openedDatePicker === 'startDate'
            ? new Date()
            : new Date(habit.startDate ?? '')
        }
        open={isOpenedDatePicker}
        // @ts-expect-error undefined
        date={new Date(habit[openedDatePicker])}
        onConfirm={handleConfirmDate}
        onCancel={() => setIsOpenedDatePicker(false)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 64,
  },
  container: {
    gap: 12,
    position: 'relative',
  },
  introCard: {
    backgroundColor: DS_COLORS.ground800,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
    overflow: 'hidden',
  },
  introEyebrow: {
    color: DS_COLORS.accent400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  introTitle: {
    color: DS_COLORS.ink50,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  introDescription: {
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  sectionTitle: {
    color: DS_COLORS.ink50,
  },
  sectionDescription: {
    color: DS_COLORS.ink100,
    lineHeight: 22,
    marginTop: 2,
  },
  emoji: {
    fontSize: 64,
  },
  radioText: {
    color: DS_COLORS.ink50,
  },
  radioTextMuted: {
    color: DS_COLORS.ink100,
  },
  button: {
    right: 0,
    left: 0,
    marginHorizontal: 16,
    marginTop: 24,
    minHeight: 56,
  },
  emojiButton: {
    aspectRatio: '1/1',
    height: 100,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  emojiBackground: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  controlButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    minHeight: 52,
    ...WEB_HOVER_TRANSITION,
    ...dsWebTransition,
  },
  controlButtonActive: {
    backgroundColor: DS_COLORS.calm600,
    borderColor: DS_COLORS.accent400,
  },
  controlButtonText: {
    color: DS_COLORS.ink50,
  },
  column: {
    flexDirection: 'column',
    gap: 8,
  },
  shape: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    gap: 12,
    overflow: 'hidden',
  },
  radioButton: {
    width: '50%',
  },
  goalInput: {
    minHeight: 52,
  },
  sliderStyle: {
    borderRadius: 20,
    marginTop: 6,
  },
  dayButton: {
    width: 50,
    height: 40,
  },
  daysCarousel: {
    maxHeight: 40,
  },
  daysCarouselItem: {
    paddingLeft: 0,
  },
});

export default HabitCreate;
