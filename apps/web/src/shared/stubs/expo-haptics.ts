export const impactAsync = async (_style?: unknown): Promise<void> => {};
export const notificationAsync = async (_type?: unknown): Promise<void> => {};
export const selectionAsync = async (): Promise<void> => {};

export const ImpactFeedbackStyle = {
  Light: 'Light',
  Medium: 'Medium',
  Heavy: 'Heavy',
} as const;

export const NotificationFeedbackType = {
  Success: 'Success',
  Warning: 'Warning',
  Error: 'Error',
} as const;
