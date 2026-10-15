import { describe, expect, it } from 'vitest';
import {
  memoryConsumeSpreadCredit,
  memoryGetSpreadCredits,
  memorySignIn,
  memorySignInWithTelegram,
  memorySignUp,
  memoryVerifyEmailOtp,
  memoryEnsureDemoUser,
  SIGNUP_SPREAD_CREDITS,
} from '../src/dev/memoryBackend';

describe('стартовый заряд в memory-бэкенде', () => {
  it('новый пользователь (email) получает ровно 1 заряд, повторный логин не начисляет', () => {
    const email = `new-${Date.now()}@example.com`;
    const res = memorySignUp({ name: 'Нов', email, password: 'secret12' });
    // Без подтверждения почты сессия выдаётся сразу; иначе пользователь создаётся после OTP.
    const session =
      res.kind === 'session' ? res.session : memoryVerifyEmailOtp({ email, code: res.devVerificationCode });
    const userId = session.user.id;
    expect(SIGNUP_SPREAD_CREDITS).toBe(1);
    expect(memoryGetSpreadCredits(userId)).toBe(1);

    memoryConsumeSpreadCredit(userId);
    expect(memoryGetSpreadCredits(userId)).toBe(0);
    memorySignIn({ email, password: 'secret12' });
    expect(memoryGetSpreadCredits(userId)).toBe(0);
  });

  it('Telegram: первый вход — 1 заряд, повторный вход — без доначисления', () => {
    const tg = 900000 + Math.floor(Math.random() * 99999);
    const a = memorySignInWithTelegram({ telegramId: tg, displayName: 'TG' });
    expect(memoryGetSpreadCredits(a.user.id)).toBe(1);
    const b = memorySignInWithTelegram({ telegramId: tg, displayName: 'TG' });
    expect(b.user.id).toBe(a.user.id);
    expect(memoryGetSpreadCredits(a.user.id)).toBe(1);
  });

  it('demo-пользователь: повторный ensure не начисляет второй заряд', () => {
    const u = memoryEnsureDemoUser();
    const before = memoryGetSpreadCredits(u.id);
    memoryEnsureDemoUser();
    expect(memoryGetSpreadCredits(u.id)).toBe(before);
    expect(before).toBeGreaterThanOrEqual(0);
  });
});
