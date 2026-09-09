import type { AuthSessionUser, TarotDailyQuota } from 'entities/user/model/types';
import { isDevQuickLoginEnabled } from './tryDevQuickLogin';

export type DevMockSession = {
  user: AuthSessionUser;
  tarotDaily: TarotDailyQuota;
  spreadCredits: number;
};

function todayUtcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Local UI mock when API quick-login is unavailable.
 * Enabled by the same EXPO_PUBLIC_DEV_QUICK_LOGIN flag.
 */
export function getDevMockSession(): DevMockSession | null {
  if (!isDevQuickLoginEnabled()) {
    return null;
  }

  return {
    user: {
      id: '00000000-0000-4000-8000-0000000000de',
      name: 'Demo Seeker',
      email: 'demo@mindful.local',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    tarotDaily: {
      used: 1,
      limit: 3,
      day: todayUtcDay(),
    },
    spreadCredits: 3,
  };
}
