import { http, HttpResponse } from 'msw';
import type { CreateSpreadBody } from '@entities/spread/model/cloudMapping';
import type { TSettings } from '@entities/settings/model/types';
import {
  DEMO_CREDITS,
  DEMO_QUOTA,
  addFavoriteId,
  clearSession,
  createSpreadRecord,
  demoTokens,
  getFavorites,
  getSession,
  getSettingsState,
  getSpreadById,
  listSpreads,
  loginDemo,
  patchSettingsState,
  removeFavoriteId,
  replaceSettings,
  updateSessionName,
  updateSpreadRecord,
} from './state';

function unauthorized() {
  return HttpResponse.json({ message: 'Authorization token is required' }, { status: 401 });
}

function sessionUser() {
  const user = getSession();
  if (!user) return null;
  return user;
}

/**
 * Общие хендлеры MSW: и браузерный worker (VITE_USE_MOCKS=1), и Vitest.
 * Контракт повторяет RTK-эндпоинты web-vite, без реального API на :3002.
 */
export const handlers = [
  http.get('*/api/auth/me', () => {
    const user = sessionUser();
    if (!user) return unauthorized();
    return HttpResponse.json({ user, tarotDaily: DEMO_QUOTA, spreadCredits: DEMO_CREDITS });
  }),

  http.post('*/api/auth/dev/quick-login', () => {
    const user = loginDemo();
    return HttpResponse.json({ user, ...demoTokens() });
  }),

  http.post('*/api/auth/telegram', async ({ request }) => {
    const body = (await request.json()) as { initData?: string };
    if (!body.initData?.trim()) {
      return HttpResponse.json({ message: 'Invalid Telegram session' }, { status: 401 });
    }
    return HttpResponse.json({ user: loginDemo() });
  }),

  http.post('*/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    return HttpResponse.json({
      needsEmailVerification: true,
      email: body.email ?? 'demo@example.com',
      devVerificationCode: '000000',
    });
  }),

  http.post('*/api/auth/signin', () => {
    return HttpResponse.json({ user: loginDemo() });
  }),

  http.post('*/api/auth/verify-email', () => {
    return HttpResponse.json({ user: loginDemo() });
  }),

  http.post('*/api/auth/resend-verification', () => {
    return HttpResponse.json({ devVerificationCode: '000000' });
  }),

  http.patch('*/api/auth/profile', async ({ request }) => {
    const user = sessionUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as { name?: string };
    const updated = updateSessionName(body.name?.trim() || user.name);
    return HttpResponse.json({ user: updated });
  }),

  http.patch('*/api/auth/password', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/auth/signout', () => {
    clearSession();
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/interpret', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({
      interpretation: 'Тестовое толкование.',
      tarotDaily: { ...DEMO_QUOTA, used: 1 },
      spreadCredits: DEMO_CREDITS,
    });
  }),

  http.post('*/api/interpret/follow-up', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({
      interpretation:
        'Карты говорят о внимании к чувствам и мягком следующем шаге. Короткий ответ по картам для локальной проверки.',
      tarotDaily: { ...DEMO_QUOTA, used: 1 },
      spreadCredits: Math.max(DEMO_CREDITS - 1, 0),
    });
  }),

  http.get('*/api/spreads/shared/:id', ({ params }) => {
    const spread = getSpreadById(String(params.id));
    if (!spread) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ spread });
  }),

  http.get('*/api/spreads', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({ spreads: listSpreads() });
  }),

  http.post('*/api/spreads', async ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const body = (await request.json()) as CreateSpreadBody;
    return HttpResponse.json({ spread: createSpreadRecord(body) });
  }),

  http.patch('*/api/spreads/:id', async ({ params, request }) => {
    if (!sessionUser()) return unauthorized();
    const body = (await request.json()) as {
      interpretation?: string | null;
      question?: string | null;
      payload?: Record<string, unknown>;
    };
    const spread = updateSpreadRecord(String(params.id), body);
    if (!spread) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ spread });
  }),

  http.get('*/api/favorites', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({ cardIds: getFavorites() });
  }),

  http.post('*/api/favorites', async ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const body = (await request.json()) as { cardId?: string };
    if (body.cardId) addFavoriteId(body.cardId);
    return HttpResponse.json({ ok: true });
  }),

  http.delete('*/api/favorites/:cardId', ({ params }) => {
    if (!sessionUser()) return unauthorized();
    removeFavoriteId(decodeURIComponent(String(params.cardId)));
    return HttpResponse.json({ ok: true });
  }),

  http.get('*/api/settings', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({ settings: getSettingsState() });
  }),

  http.put('*/api/settings', async ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const body = (await request.json()) as { settings?: TSettings };
    return HttpResponse.json({ settings: replaceSettings(body.settings ?? getSettingsState()) });
  }),

  http.patch('*/api/settings', async ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const patch = (await request.json()) as Partial<TSettings>;
    return HttpResponse.json({ settings: patchSettingsState(patch) });
  }),

  http.post('*/api/motivation/:key', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({
      interpretation: 'Тестовая мотивация.',
      tarotDaily: DEMO_QUOTA,
      spreadCredits: DEMO_CREDITS,
    });
  }),

  http.post('*/api/payments/lava/checkout', () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json({
      paymentUrl: 'https://pay.example.test/checkout',
      invoiceId: 'inv-demo',
    });
  }),
];
