import { useState } from 'react';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { HabitsContext } from 'entities/habits';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { ColorFormatsObject } from 'reanimated-color-picker';
import {
  DEFAULT_NEGATIVE_HABIT,
  DEFAULT_POSITIVE_HABIT,
} from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getDateISO } from 'shared/lib';
import { COLORS } from 'shared/themes';
import {
  HabitFrequency,
  HabitType,
  IPositiveHabit,
  INegativeHabit,
  NavigationRoute,
  TabRoute,
  THabit,
  THabitGoal,
} from 'shared/types';

export type TDateProperty = 'startDate' | 'endDate';

type THabitCreateHookParameters = {
  habitType: HabitType;
};

type THabitCreateHookResult = {
  isEmojiOpen: boolean;
  isOpenedDatePicker: boolean;
  openedDatePicker: TDateProperty;
  currentColor: SharedValue<string>;
  habit: THabit;
  habitGoal: THabitGoal;
  setIsOpenedDatePicker: (value: boolean) => void;
  handleOpenDatePicker: (dateProperty: TDateProperty) => void;
  handleToggleEmoji: () => void;
  handleClickFrequencyDays: (index: number) => void;
  handleToggleSwitchEndDate: (value: boolean) => void;
  handleToggleFrequencyDays: (value: boolean) => void;
  handleToggleAutoFill: (value: boolean) => void;
  handleColorChange: (color: ColorFormatsObject) => void;
  handleColorPick: (color: ColorFormatsObject) => void;
  handleChangeHabit: (property: keyof THabit) => (text: string) => void;
  handleChangeHabitGoal: (property: keyof THabitGoal) => (text: string) => void;
  handleChangeFrequency: (frequency: HabitFrequency) => void;
  handleConfirmDate: (date: Date) => void;
  handleSubmit: () => Promise<void>;
};

export function useHabitCreate({
  habitType,
}: THabitCreateHookParameters): THabitCreateHookResult {
  const { createHabit } = useData({ Context: HabitsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const [isOpenedDatePicker, setIsOpenedDatePicker] = useState<boolean>(false);
  const [openedDatePicker, setOpenedDatePicker] =
    useState<TDateProperty>('startDate');
  const [isEmojiOpen, setIsEmojiOpen] = useState<boolean>(false);

  const [habitGoal, setHabitGoal] = useState<THabitGoal>({
    amount: 0,
    startDate: getDateISO(new Date()),
    unit: '',
  });

  const DATES = {
    startDate: getDateISO(new Date()),
  };

  const [habit, setHabit] = useState<THabit>(
    habitType === HabitType.BuildPositive
      ? { ...DEFAULT_POSITIVE_HABIT, ...DATES }
      : { ...DEFAULT_NEGATIVE_HABIT, ...DATES }
  );

  const currentColor = useSharedValue(COLORS.SpbSky3);

  const navigation = useNativeNavigation();

  const handleToggleEmoji = () => {
    setIsEmojiOpen((prevState) => !prevState);

    handleVibrationClick?.();
  };

  const handleChangeHabitGoal =
    (property: keyof THabitGoal) => (text: string) => {
      setHabitGoal((prevState) => ({
        ...prevState,
        [property]: property === 'amount' ? Number(text) : text,
      }));
    };

  const handleChangeHabit = (property: keyof THabit) => (text: string) => {
    setHabit((prevState) => ({ ...prevState, [property]: text }));
  };

  const handleColorChange = (color: ColorFormatsObject) => {
    'worklet';
    currentColor.value = color.hex;
  };

  const handleColorPick = (color: ColorFormatsObject) => {
    setHabit((prevState) => ({ ...prevState, color: color.hex }));
  };

  const handleConfirmDate = (date: Date) => {
    setHabit((prevState) => ({
      ...prevState,
      [openedDatePicker]: getDateISO(date),
    }));
    setIsOpenedDatePicker(false);
  };

  const handleOpenDatePicker = (dateProperty: TDateProperty) => {
    handleVibrationClick?.();

    setOpenedDatePicker(dateProperty);
    setIsOpenedDatePicker(true);
  };

  const handleChangeFrequency = (frequency: HabitFrequency) => {
    setHabit((prevState) => ({ ...prevState, frequency }));
  };

  const handleToggleSwitchEndDate = (value: boolean) => {
    handleVibrationClick?.();

    if (!value) {
      setOpenedDatePicker('startDate');
      setHabit((prevState) => ({ ...prevState, endDate: null }));

      return;
    }

    setHabit((prevState) => ({
      ...prevState,
      endDate: getDateISO(new Date()),
    }));
  };

  const handleToggleFrequencyDays = (value: boolean) => {
    setHabit((prevState) => ({
      ...prevState,
      frequencyDays: value ? [0, 1, 2, 3, 4, 5, 6] : [],
    }));

    handleVibrationClick?.();
  };

  const handleClickFrequencyDays = (index: number) => {
    setHabit((prevState) => {
      const prevStatePositive = prevState as IPositiveHabit;

      if (prevStatePositive.frequencyDays.includes(index)) {
        return {
          ...prevState,
          frequencyDays: prevStatePositive.frequencyDays.filter(
            (item) => item !== index
          ),
        };
      }

      return {
        ...prevState,
        frequencyDays: [...prevStatePositive.frequencyDays, index],
      };
    });

    handleVibrationClick?.();
  };

  const handleToggleAutoFill = (value: boolean) => {
    handleVibrationClick?.();

    setHabit((prevState) => {
      if (prevState.type !== HabitType.QuitNegative) {
        return prevState;
      }

      return {
        ...prevState,
        isAutoFillEnabled: value,
      } as INegativeHabit;
    });
  };

  const handleSubmit = async () => {
    await handleVibrationClick?.();

    const resultedHabit: THabit = {
      ...habit,
      id: Date.now().toString(),
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString(),
    };

    switch (habitType) {
      case HabitType.BuildPositive:
        await createHabit?.({
          ...resultedHabit,
          goals: [habitGoal],
        } as IPositiveHabit);

        break;
      case HabitType.QuitNegative:
        await createHabit?.(resultedHabit);

        break;
      default:
        break;
    }

    navigation.navigate(TabRoute.MainTab, {
      screen: NavigationRoute.Main,
    });
  };

  return {
    isEmojiOpen,
    habitGoal,
    isOpenedDatePicker,
    handleOpenDatePicker,
    handleSubmit,
    openedDatePicker,
    currentColor,
    habit,
    setIsOpenedDatePicker,
    handleClickFrequencyDays,
    handleToggleFrequencyDays,
    handleToggleAutoFill,
    handleChangeFrequency,
    handleToggleSwitchEndDate,
    handleChangeHabitGoal,
    handleChangeHabit,
    handleToggleEmoji,
    handleColorChange,
    handleColorPick,
    handleConfirmDate,
  };
}
