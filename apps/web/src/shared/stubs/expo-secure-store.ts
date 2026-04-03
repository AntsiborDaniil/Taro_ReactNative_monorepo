export const getItemAsync = async (key: string): Promise<string | null> =>
  localStorage.getItem(key);

export const setItemAsync = async (key: string, value: string): Promise<void> =>
  void localStorage.setItem(key, value);

export const deleteItemAsync = async (key: string): Promise<void> =>
  void localStorage.removeItem(key);
