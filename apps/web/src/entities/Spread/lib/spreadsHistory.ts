import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { TSpread } from 'shared/api';
import {
  AsyncMemoryKey,
  getTodayISO,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';

export async function getLastSpreadsPackIndex(): Promise<number> {
  try {
    const index: string | null = await AsyncStorage.getItem(
      'lastSpreadsPackIndex'
    );

    return index ? parseInt(index, 10) : 0;
  } catch (error) {
    console.error('Не удалось получить индекс расклада:', error);
    return 0;
  }
}

export async function saveSpread(
  spread: TSpread
): Promise<TSpread | undefined> {
  try {
    if (spread.uid && spread.packKey) {
      const packJson: string | null = await AsyncStorage.getItem(
        spread.packKey
      );

      if (packJson) {
        const pack = JSON.parse(packJson) as TSpread[];

        const recentlySavedPackIndex = pack.findIndex(
          (p) => p.uid === spread.uid
        );

        pack[recentlySavedPackIndex] = spread;

        await AsyncStorage.setItem(spread.packKey, JSON.stringify(pack));

        return spread;
      }
    }

    const date: string = new Date().toISOString();
    const uid: string = uuidv4();

    const lastPackIndex: number = await getLastSpreadsPackIndex();
    let packKey: string = `spreadsPack_${lastPackIndex}`;

    let pack: TSpread[] = [];

    const packJson: string | null = await AsyncStorage.getItem(packKey);

    if (packJson) {
      pack = JSON.parse(packJson) as TSpread[];
    }

    // Если пак полный (20 элементов), создаем новый
    if (pack.length >= 20) {
      const newPackIndex: number = lastPackIndex + 1;
      packKey = `spreadsPack_${newPackIndex}`;

      pack = [];

      await AsyncStorage.setItem(
        'lastSpreadsPackIndex',
        newPackIndex.toString()
      );

      await AsyncStorage.setItem(packKey, JSON.stringify(pack));
    }

    const savedSpread: TSpread = { uid, date, packKey, ...spread };

    pack.unshift(savedSpread);

    await AsyncStorage.setItem(packKey, JSON.stringify(pack));

    const currentAmountSpreads = await getValueForAsyncDeviceMemoryKey<
      Record<string, string>
    >(AsyncMemoryKey.LimitOfSpreads);

    await saveAsyncDeviceMemoryKey<Record<string, string>>(
      AsyncMemoryKey.LimitOfSpreads,
      {
        ...(currentAmountSpreads || {}),
        [getTodayISO()]: String(
          Number(currentAmountSpreads?.[getTodayISO()] ?? '0') + 1
        ),
      }
    );

    return savedSpread;
  } catch (error) {
    console.error('Ошибка сохранения расклада в историю:', error);
  }
}

export async function getSpreadsHistory(
  packIndex: number | null = null
): Promise<TSpread[]> {
  try {
    const lastPackIndex: number =
      packIndex !== null ? packIndex : await getLastSpreadsPackIndex();

    const packKey: string = `spreadsPack_${lastPackIndex}`;
    const packJson: string | null = await AsyncStorage.getItem(packKey);

    return packJson ? (JSON.parse(packJson) as TSpread[]) : [];
  } catch (error) {
    console.error('Ошибка загруки истории:', error);
    return [];
  }
}
