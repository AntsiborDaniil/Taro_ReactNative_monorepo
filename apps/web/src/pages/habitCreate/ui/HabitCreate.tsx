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
} from 'shared/ui';
import { useHabitCreate } from '../model';

const screen = Dimensions.get('screen');

function HabitCreate() {
  const { t, i18n } = useTranslation();
  const route = useRoute<any>();
  const { habitType } = route.params || {};

  const { bottom } = useSafeAreaInsets();

  const weekDays = getLocalizedWeekdays(i18n.language);

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
      <Header showBackButton title={t('habits:page.habitCreate')} />
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={styles.container}
      >
        <View style={styles.shape}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label="habits:title.habit"
                baseInputProps={{
                  style: [styles.input, { maxWidth: screen.width - 168 }],
                  value: habit.title,
                  onChangeText: handleChangeHabit('title'),
                  placeholder: t('habits:placeholder.habitTitle'),
                }}
              />
              <Input
                baseInputProps={{
                  style: [
                    styles.input,
                    styles.smallInput,
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
              <View style={styles.row}>
                <Text>{t('habits:title.goal')}</Text>
                <View style={[styles.row, { width: '50%' }]}>
                  <Input
                    baseInputProps={{
                      style: [
                        styles.input,
                        styles.smallInput,
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
                      style: [
                        styles.input,
                        styles.smallInput,
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
                    style={
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.OneTime
                        ? styles.radioText
                        : null
                    }
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
                    style={
                      (habit as IPositiveHabit).frequency ===
                      HabitFrequency.Daily
                        ? styles.radioText
                        : null
                    }
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
                            style={
                              (habit as IPositiveHabit).frequencyDays.includes(
                                item.index
                              )
                                ? styles.radioText
                                : null
                            }
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
              <Text>{t('habits:title.startDate')}</Text>
              <Button
                style={[styles.controlButton, { width: '50%' }]}
                onPress={() => handleOpenDatePicker('startDate')}
              >
                {new Date(habit.startDate).toLocaleDateString()}
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
            <Text category={TEXT_TAGS.label}>
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
              {new Date(habit.endDate).toLocaleDateString()}
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
    paddingBottom: 48,
  },
  container: {
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  innerInput: {
    backgroundColor: COLORS.SpbSky3,
    paddingLeft: 8,
    borderRadius: 6,
  },
  radioUnpressed: {
    backgroundColor: COLORS.SpbSky3,
  },
  radioText: {
    color: COLORS.Background,
  },
  button: {
    right: 0,
    left: 0,
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 32,
  },
  buttonText: {
    color: COLORS.Background,
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
    gap: 4,
    justifyContent: 'space-between',
  },
  controlButton: {
    borderRadius: 10,
  },
  column: {
    flexDirection: 'column',
    gap: 4,
  },
  shape: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: COLORS.Primary700,
    gap: 8,
  },
  input: {
    borderWidth: 0,
    paddingLeft: 0,
    backgroundColor: 'transparent',
    fontSize: 22,
    fontWeight: 500,
  },
  radioButton: {
    width: '50%',
  },
  smallInput: {
    fontSize: 22,
    fontWeight: 400,
  },
  sliderStyle: {
    borderRadius: 20,
    marginTop: 4,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
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
