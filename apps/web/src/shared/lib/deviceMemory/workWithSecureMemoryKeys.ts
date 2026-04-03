import * as SecureStore from 'expo-secure-store';
import type { SecureMemoryKey } from './keys';

export async function saveSecureDeviceMemoryKey(
  key: SecureMemoryKey,
  value: string
): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getValueForSecureDeviceMemoryKey(
  key: SecureMemoryKey
): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}
