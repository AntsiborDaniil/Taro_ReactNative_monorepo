/**
 * Единая тактильная отдача. В Telegram Mini App — WebApp.HapticFeedback
 * (работает и на iPhone), на обычном вебе — navigator.vibrate как запасной
 * вариант (Safari/iOS его молча игнорирует). Выключатель «Вибрация» из
 * настроек синхронизирует useSettings через setHapticsEnabled.
 */

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotifyType = 'error' | 'success' | 'warning';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

function telegramHaptic(): TelegramHapticFeedback | undefined {
  if (typeof window === 'undefined') return undefined;
  const webApp = window.Telegram?.WebApp;
  // Вне Telegram скрипт bridge тоже может быть загружен, но без initData
  // вызовы HapticFeedback бесполезны.
  if (!webApp?.initData) return undefined;
  return webApp.HapticFeedback;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration API может бросить в iframe без user activation — не критично.
    }
  }
}

const IMPACT_MS: Record<ImpactStyle, number> = { soft: 6, light: 10, medium: 18, rigid: 22, heavy: 30 };
const NOTIFY_PATTERN: Record<NotifyType, number[]> = {
  success: [10, 40, 10],
  warning: [20, 60, 20],
  error: [30, 60, 30, 60, 30],
};

export const haptic = {
  impact(style: ImpactStyle = 'light'): void {
    if (!enabled) return;
    const tg = telegramHaptic();
    if (tg) {
      tg.impactOccurred(style);
      return;
    }
    vibrate(IMPACT_MS[style]);
  },
  selection(): void {
    if (!enabled) return;
    const tg = telegramHaptic();
    if (tg) {
      tg.selectionChanged();
      return;
    }
    vibrate(5);
  },
  notify(type: NotifyType = 'success'): void {
    if (!enabled) return;
    const tg = telegramHaptic();
    if (tg) {
      tg.notificationOccurred(type);
      return;
    }
    vibrate(NOTIFY_PATTERN[type]);
  },
  success(): void {
    haptic.notify('success');
  },
};
