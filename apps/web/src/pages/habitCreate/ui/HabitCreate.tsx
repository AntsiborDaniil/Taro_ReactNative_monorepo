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
import { getLocalizedWeekdays } from 'shared/lib';
import { COLORS } from 'shared/themes';
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
    placeholderTextColor: 'rgba(255,255,255,0.46)',
    selectionColor: COLORS.Primary,
    cursorColor: COLORS.Primary,
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
          <View style={styles.sectionGlow} />
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
          <View style={styles.sectionGlow} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label="habits:title.habit"
                baseInputProps={{
                  ...inputBaseProps,
                  style: [
                    styles.input,
                    styles.largeInput,
                    styles.habitPrimaryInput,
                    { maxWidth: screen.width - 168 },
                  ],
                  value: habit.title,
                  onChangeText: handleChangeHabit('title'),
                  placeholder: t('habits:placeholder.habitTitle'),
                }}
              />
              <Input
                baseInputProps={{
                  ...inputBaseProps,
                  style: [
                    styles.input,
                    styles.largeInput,
                    styles.smallInput,
                    styles.habitPrimaryInput,
                    { maxWidth: screen.width - 168 },
                  ],
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
              <View style={styles.sectionGlow} />
              <View style={styles.row}>
                <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                  {t('habits:title.goal')}
                </Text>
                <View style={[styles.row, { width: '50%' }]}>
                  <Input
                    baseInputProps={{
                      ...inputBaseProps,
                      style: [
                        styles.input,
                        styles.smallInput,
                        styles.goalInput,
                        styles.innerInput,
                      ],
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
                      style: [
                        styles.input,
                        styles.smallInput,
                        styles.goalInput,
                        styles.innerInput,
                      ],
                      value: habitGoal.unit,
                      onChangeText: handleChangeHabitGoal('unit'),
                      placeholder: t('habits:placeholder.goalUnit'),
                    }}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.shape, { gap: 16 }]}>
              <View style={styles.sectionGlow} />
              <View style={styles.row}>
                <Button
                  style={[
                    styles.controlButton,
                    styles.radioButton,
                    (habit as IPositiveHabit).frequency === HabitFrequency.Daily
                      ? styles.radioUnpressed
                      : null,
                  ]}
                  onPress={() => handleChangeFrequency(HabitFrequency.OneTime)}
                >
                  <Text
                    category={TEXT_TAGS.label}
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
                    HabitFrequency.OneTime
                      ? styles.radioUnpressed
                      : null,
                  ]}
                  onPress={() => handleChangeFrequency(HabitFrequency.Daily)}
                >
                  <Text
                    category={TEXT_TAGS.label}
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
                              ? null
                              : styles.radioUnpressed,
                          ]}
                          onPress={() => handleClickFrequencyDays(item.index)}
                        >
                          <Text
                            category={TEXT_TAGS.label}
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
            <View style={styles.sectionGlow} />
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
            <View style={styles.sectionGlow} />
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
          <View style={styles.sectionGlow} />
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
        style={[styles.button, { bottom }]}
        onPress={handleSubmit}
      >
        <Text category={TEXT_TAGS.h3} style={styles.buttonText}>
          {t('habits:button.create')}
        </Text>
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
    backgroundColor: 'rgba(17, 26, 42, 0.94)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(164, 188, 228, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    overflow: 'hidden',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)',
        } as object)
      : {}),
  },
  introTitle: {
    color: COLORS.Content,
    marginBottom: 2,
  },
  introDescription: {
    color: 'rgba(218, 230, 255, 0.7)',
    lineHeight: 22,
  },
  sectionTitle: {
    color: COLORS.Content,
  },
  sectionDescription: {
    color: 'rgba(218, 230, 255, 0.7)',
    lineHeight: 22,
    marginTop: 2,
  },
  emoji: {
    fontSize: 64,
  },
  innerInput: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(176, 197, 236, 0.2)',
    paddingLeft: 12,
    borderRadius: 10,
  },
  radioUnpressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(180, 198, 229, 0.2)',
  },
  radioText: {
    color: COLORS.Content,
    fontWeight: 600,
  },
  radioTextMuted: {
    color: 'rgba(255,255,255,0.62)',
  },
  button: {
    right: 0,
    left: 0,
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(224, 195, 124, 0.42)',
    backgroundColor: 'rgba(137, 106, 44, 0.28)',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 8px 18px rgba(85, 62, 21, 0.22)',
        } as object)
      : {}),
  },
  buttonText: {
    color: '#F9ECD2',
  },
  emojiButton: {
    aspectRatio: '1/1',
    height: 100,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  emojiBackground: {
    borderRadius: 10,
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
    borderColor: 'rgba(176, 197, 236, 0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 52,
    ...({
      transition: 'border-color 0.2s ease, background-color 0.2s ease',
    } as object),
  },
  controlButtonText: {
    color: COLORS.Content,
  },
  column: {
    flexDirection: 'column',
    gap: 4,
  },
  shape: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'rgba(164, 188, 228, 0.2)',
    backgroundColor: 'rgba(17, 26, 42, 0.9)',
    gap: 12,
    overflow: 'hidden',
    ...({
      boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
    } as object),
  },
  sectionGlow: {
    position: 'absolute',
    width: 70,
    height: 2,
    top: 0,
    left: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(182, 166, 245, 0.85)',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(176, 197, 236, 0.2)',
    paddingLeft: 12,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 10,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontWeight: 400,
    color: '#FFFFFF',
  },
  largeInput: {
    minHeight: 56,
    paddingVertical: 12,
  },
  radioButton: {
    width: '50%',
  },
  smallInput: {
    fontSize: 14,
    fontWeight: 400,
  },
  habitPrimaryInput: {
    fontSize: 18,
  },
  goalInput: {
    minHeight: 52,
    paddingVertical: 10,
  },
  sliderStyle: {
    borderRadius: 20,
    marginTop: 6,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
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
