import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import { gradientPallets } from 'shared/themes';
import { UserContext } from '../../user';
import {
  AffirmationCategory,
  TAffirmationTexts,
  TSavedAffirmations,
  TSelectedAffirmation,
} from './types';

export type TAffirmationsHookResult = {
  selectedAffirmation: TSelectedAffirmation | null;
  selectedAffirmationCategory: AffirmationCategory | null;
  handleSelectedAffirmationCategory: (value: AffirmationCategory) => void;
};

export function useAffirmations(): TAffirmationsHookResult {
  const [selectedAffirmation, setSelectedAffirmation] =
    useState<TSelectedAffirmation | null>(null);
  const [selectedAffirmationCategory, setSelectedAffirmationCategory] =
    useState<AffirmationCategory | null>(null);

  const { t } = useTranslation();

  const { isPractitioner } = useData({ Context: UserContext });

  const handleSelectedAffirmationCategory = useCallback(
    async (category: AffirmationCategory) => {
      setSelectedAffirmationCategory(category);

      const memorySelectedAffirmations =
        await getValueForAsyncDeviceMemoryKey<TSavedAffirmations>(
          AsyncMemoryKey.SelectedAffirmations
        );

      const today = new Date().toISOString().split('T')[0];

      const savedAffirmation = memorySelectedAffirmations?.[today]?.[category];

      if (savedAffirmation) {
        setSelectedAffirmation(savedAffirmation);

        return;
      }

      const affirmations = t(`affirmations:affirmationsItems.${category}`, {
        returnObjects: true,
      }) as TAffirmationTexts[];

      if (!affirmations.length) {
        return;
      }

      const newAffirmation: TSelectedAffirmation = {
        colors:
          gradientPallets[Math.floor(Math.random() * gradientPallets.length)],
        texts: affirmations[Math.floor(Math.random() * affirmations.length)],
      };

      const savingElement: TSavedAffirmations = {
        ...(memorySelectedAffirmations ?? {}),
        [today]: {
          ...(memorySelectedAffirmations?.[today] ?? {}),
          [category]: newAffirmation,
        },
      };

      setSelectedAffirmation(newAffirmation);

      await saveAsyncDeviceMemoryKey<TSavedAffirmations>(
        AsyncMemoryKey.SelectedAffirmations,
        savingElement
      );

      await AsyncStorage.setItem(
        AsyncMemoryKey.SelectedAffirmationCategory,
        category
      );
    },
    [t]
  );

  useEffect(() => {
    if (selectedAffirmationCategory && selectedAffirmation) {
      return;
    }

    async function selectDefaultCategory() {
      const memorySelectedAffirmationCategory = (await AsyncStorage.getItem(
        AsyncMemoryKey.SelectedAffirmationCategory
      )) as AffirmationCategory | null;

      const category = isPractitioner
        ? memorySelectedAffirmationCategory
        : AffirmationCategory.General;

      await handleSelectedAffirmationCategory(
        category ?? AffirmationCategory.General
      );
    }

    selectDefaultCategory();
  }, [
    handleSelectedAffirmationCategory,
    isPractitioner,
    selectedAffirmation,
    selectedAffirmationCategory,
  ]);

  return {
    selectedAffirmation,
    selectedAffirmationCategory,
    handleSelectedAffirmationCategory,
  };
}
