/** Локальный флаг: уже предлагали / отказались / добавили / клиент не умеет. */
export type HomeScreenPromptState = 'dismissed' | 'added' | 'unsupported';

const STORAGE_KEY = 'tarot_home_screen_prompt';

export function readHomeScreenPromptState(): HomeScreenPromptState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'dismissed' || raw === 'added' || raw === 'unsupported') return raw;
  } catch {
    // private mode / denied
  }
  return null;
}

export function writeHomeScreenPromptState(state: HomeScreenPromptState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // ignore
  }
}
