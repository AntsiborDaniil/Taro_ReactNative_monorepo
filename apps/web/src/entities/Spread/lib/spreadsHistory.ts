import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  TSpread,
} from 'shared/api';
import {
  createCloudSpread,
  isCloudSpread,
  listCloudSpreads,
  spreadToCloudBody,
  updateCloudSpread,
} from 'shared/api/cloud';
import {
  AsyncMemoryKey,
  getTodayISO,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';

const CLOUD_PAGE_SIZE = 20;

export type SpreadsHistoryPage = {
  spreads: TSpread[];
  hasMore: boolean;
  nextOffset: number;
  usesCloud: boolean;
};

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

export async function getLocalSpreadsHistory(
  packIndex: number | null = null
): Promise<TSpread[]> {
  try {
    const lastPackIndex: number =
      packIndex !== null ? packIndex : await getLastSpreadsPackIndex();

    const packKey: string = `spreadsPack_${lastPackIndex}`;
    const packJson: string | null = await AsyncStorage.getItem(packKey);

    return packJson ? (JSON.parse(packJson) as TSpread[]) : [];
  } catch (error) {
    console.error('Ошибка загрузки локальной истории:', error);
    return [];
  }
}

export async function getSpreadsHistoryPage(options: {
  offset?: number;
  limit?: number;
  packIndex?: number | null;
}): Promise<SpreadsHistoryPage> {
  const limit = options.limit ?? CLOUD_PAGE_SIZE;
  const offset = options.offset ?? 0;

  if (Platform.OS === 'web') {
    const cloudSpreads = await listCloudSpreads({ limit, offset });
    if (cloudSpreads !== null) {
      return {
        spreads: cloudSpreads,
        hasMore: cloudSpreads.length >= limit,
        nextOffset: offset + cloudSpreads.length,
        usesCloud: true,
      };
    }
  }

  const packIndex =
    options.packIndex !== undefined
      ? options.packIndex
      : await getLastSpreadsPackIndex();
  const spreads = await getLocalSpreadsHistory(packIndex);

  return {
    spreads,
    hasMore: (packIndex ?? 0) > 0,
    nextOffset: offset,
    usesCloud: false,
  };
}

export async function getSpreadsHistory(
  packIndex: number | null = null
): Promise<TSpread[]> {
  const page = await getSpreadsHistoryPage({ packIndex });
  return page.spreads;
}

async function saveSpreadLocally(
  spread: TSpread
): Promise<TSpread | undefined> {
  if (spread.uid && spread.packKey && spread.packKey !== 'cloud') {
    const packJson: string | null = await AsyncStorage.getItem(spread.packKey);

    if (packJson) {
      const pack = JSON.parse(packJson) as TSpread[];
      const recentlySavedPackIndex = pack.findIndex((p) => p.uid === spread.uid);

      if (recentlySavedPackIndex >= 0) {
        pack[recentlySavedPackIndex] = spread;
        await AsyncStorage.setItem(spread.packKey, JSON.stringify(pack));
        return spread;
      }
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

  if (pack.length >= 20) {
    const newPackIndex: number = lastPackIndex + 1;
    packKey = `spreadsPack_${newPackIndex}`;
    pack = [];
    await AsyncStorage.setItem('lastSpreadsPackIndex', newPackIndex.toString());
    await AsyncStorage.setItem(packKey, JSON.stringify(pack));
  }

  const savedSpread: TSpread = { uid, date, packKey, ...spread };
  pack.unshift(savedSpread);
  await AsyncStorage.setItem(packKey, JSON.stringify(pack));
  return savedSpread;
}

async function saveSpreadToCloud(
  spread: TSpread
): Promise<TSpread | undefined> {
  if (isCloudSpread(spread) && spread.uid) {
    const updated = await updateCloudSpread(spread.uid, {
      interpretation: spread.interpretation ?? null,
      question: spread.question ?? null,
      payload: spreadToCloudBody(spread).payload,
    });
    return updated ?? spread;
  }

  const created = await createCloudSpread(spread);
  return created ?? undefined;
}

export async function saveSpread(
  spread: TSpread
): Promise<TSpread | undefined> {
  try {
    if (Platform.OS === 'web') {
      const cloudSpread = await saveSpreadToCloud(spread);
      if (cloudSpread) {
        return cloudSpread;
      }
    }

    const savedSpread = await saveSpreadLocally(spread);
    if (!savedSpread) {
      return undefined;
    }

    if (Platform.OS !== 'web') {
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
    }

    return savedSpread;
  } catch (error) {
    console.error('Ошибка сохранения расклада в историю:', error);
  }
}
