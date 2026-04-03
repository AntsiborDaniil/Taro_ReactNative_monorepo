import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AsyncMemoryKey } from './keys';

export async function saveAsyncDeviceMemoryKey<T>(
  key: AsyncMemoryKey | string,
  value: T
): Promise<void> {
  const jsonLike = JSON.stringify(value);

  await AsyncStorage.setItem(key, jsonLike);
}

export async function getValueForAsyncDeviceMemoryKey<T>(
  key: AsyncMemoryKey | string
): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key);

    if (!item) {
      return null;
    }

    return JSON.parse(item);
  } catch (e) {
    console.error('Не удалось вытащить json');
    console.error(e);
  }

  return null;
}

export async function clearAllData() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Ошибка при очистке AsyncStorage:', error);
  }
}
