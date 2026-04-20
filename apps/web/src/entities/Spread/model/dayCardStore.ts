import { SpreadName, TSpread } from 'shared/api';
import { getTodayISO } from 'shared/lib';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib/deviceMemory';

type TDayCardsByDate = Record<string, TSpread>;

function getLocalTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayCandidateKeys(): string[] {
  const localToday = getLocalTodayISO();
  const utcToday = getTodayISO();

  return localToday === utcToday ? [localToday] : [localToday, utcToday];
}

function normalizeSelectedCards(value: unknown): TSpread['selectedCards'] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, card]) => card as TSpread['selectedCards'][number]);
}

function normalizeDaySpread(value: unknown): TSpread | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const spread = value as TSpread;

  if (spread.id !== SpreadName.Simple_DaySuggest) {
    return null;
  }

  return {
    ...spread,
    selectedCards: normalizeSelectedCards(spread.selectedCards),
  };
}

export async function getTodayDayCard(): Promise<TSpread | null> {
  const dayCards = await getValueForAsyncDeviceMemoryKey<TDayCardsByDate>(
    AsyncMemoryKey.SelectedCardsOfTheDay
  );

  for (const key of getTodayCandidateKeys()) {
    const todaySpread = normalizeDaySpread(dayCards?.[key]);

    if (todaySpread) {
      return todaySpread;
    }
  }

  return null;
}

export async function saveTodayDayCard(spread: TSpread): Promise<void> {
  const dayCards = await getValueForAsyncDeviceMemoryKey<TDayCardsByDate>(
    AsyncMemoryKey.SelectedCardsOfTheDay
  );

  const spreadToSave = normalizeDaySpread(spread);

  if (!spreadToSave) {
    return;
  }

  const nextDayCards = {
    ...(dayCards || {}),
  };

  for (const key of getTodayCandidateKeys()) {
    nextDayCards[key] = spreadToSave;
  }

  await saveAsyncDeviceMemoryKey<TDayCardsByDate>(
    AsyncMemoryKey.SelectedCardsOfTheDay,
    nextDayCards
  );
}

export async function clearTodayDayCard(): Promise<void> {
  const dayCards = await getValueForAsyncDeviceMemoryKey<TDayCardsByDate>(
    AsyncMemoryKey.SelectedCardsOfTheDay
  );

  if (!dayCards) {
    return;
  }

  const nextDayCards = { ...dayCards };
  let hasChanges = false;

  for (const key of getTodayCandidateKeys()) {
    if (key in nextDayCards) {
      delete nextDayCards[key];
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return;
  }

  await saveAsyncDeviceMemoryKey<TDayCardsByDate>(
    AsyncMemoryKey.SelectedCardsOfTheDay,
    nextDayCards
  );
}
