import { TMemoryMoodItem } from 'shared/api';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';

const STORAGE_KEY: AsyncMemoryKey = AsyncMemoryKey.MoodData;

export const NUMERICAL_MOOD_VALUES = {
  mood: true,
  energy: true,
  stress: true,
};

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateDateRange(days: number): string[] {
  const today = new Date();
  const result: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    result.push(date.toISOString().split('T')[0]);
  }

  return result;
}

export async function getMoodDatesValues(): Promise<TMemoryMoodItem[]> {
  const storedMoodData =
    await getValueForAsyncDeviceMemoryKey<TMemoryMoodItem[]>(STORAGE_KEY);

  const datesRange = generateDateRange(365);

  const storedMoodDataDictionary = storedMoodData?.reduce(
    (acc: Record<string, TMemoryMoodItem>, currentValue) => {
      acc[currentValue.date] = currentValue;

      return acc;
    },
    {}
  );

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  const today = new Date();
  const todatStr = today.toISOString().split('T')[0];

  const newRanges: TMemoryMoodItem[] = datesRange.map((item) => {
    return {
      date: item,
      mood: storedMoodDataDictionary?.[item]?.mood ?? null,
      stress: storedMoodDataDictionary?.[item]?.stress ?? null,
      energy: storedMoodDataDictionary?.[item]?.energy ?? null,
    };
  });

  await saveAsyncDeviceMemoryKey<TMemoryMoodItem[]>(
    AsyncMemoryKey.MoodData,
    newRanges
  );

  return newRanges;
}

export function aggregateMoodsByMonth(
  data: TMemoryMoodItem[]
): TMemoryMoodItem[] {
  if (!data || data.length === 0) return [];

  // Берём только последние 365 дней
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(today.getDate() - 365);

  const filtered = data.filter((item) => {
    const d = new Date(item.date);
    return d >= oneYearAgo && d <= today;
  });

  // Группируем по "YYYY-MM"
  const grouped: Record<string, TMemoryMoodItem[]> = {};
  filtered.forEach((item) => {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  // Считаем средние по каждому месяцу
  const result: TMemoryMoodItem[] = Object.entries(grouped).map(
    ([monthKey, items]) => {
      const sum = { mood: 0, energy: 0, stress: 0 };
      const count = { mood: 0, energy: 0, stress: 0 };

      items.forEach((item) => {
        if (item.mood !== null) {
          sum.mood += item.mood;
          count.mood++;
        }
        if (item.energy !== null) {
          sum.energy += item.energy;
          count.energy++;
        }
        if (item.stress !== null) {
          sum.stress += item.stress;
          count.stress++;
        }
      });

      return {
        date: monthKey + '-01', // дата = первый день месяца
        mood: count.mood > 0 ? sum.mood / count.mood : null,
        energy: count.energy > 0 ? sum.energy / count.energy : null,
        stress: count.stress > 0 ? sum.stress / count.stress : null,
      };
    }
  );

  // Сортируем по возрастанию даты (от старых к новым)
  result.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return result;
}
