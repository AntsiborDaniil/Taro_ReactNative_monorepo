import { beforeEach, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { store } from '@app/store';
import { favoritesApi } from '@entities/favorites/api';
import { settingsApi } from '@entities/settings/api';
import { spreadApi } from '@entities/spread/api';
import type { TarotSpreadInput } from '@entities/spread/model/getAIRequestBody';
import { userApi } from '@entities/user/api';
import { baseApi } from '@shared/api/baseApi';
import { server } from './setup';
import { DEMO_SPREAD_ID, DEMO_USER } from './state';

const interpretBody: TarotSpreadInput = {
  spread_type: 'day',
  language: 'ru',
  question: 'Как пройдёт день?',
  positions: [],
};

beforeEach(() => {
  store.dispatch(baseApi.util.resetApiState());
});

async function loginDemo(): Promise<void> {
  await store.dispatch(userApi.endpoints.devQuickLogin.initiate()).unwrap();
}

test('гость получает 401 на /api/auth/me и остаётся неавторизованным', async () => {
  const request = store.dispatch(userApi.endpoints.authMe.initiate());
  await expect(request.unwrap()).rejects.toMatchObject({ status: 401 });
  request.unsubscribe();

  const user = store.getState().user;
  expect(user.isAuthenticated).toBe(false);
  expect(user.sessionLoading).toBe(false);
  expect(user.user).toBeNull();
});

test('dev quick-login и повторный /me заполняют userSlice', async () => {
  await loginDemo();

  const request = store.dispatch(userApi.endpoints.authMe.initiate(undefined, { forceRefetch: true }));
  const session = await request.unwrap();
  request.unsubscribe();

  expect(session.user.name).toBe(DEMO_USER.name);
  expect(session.spreadCredits).toBe(3);

  const user = store.getState().user;
  expect(user.isAuthenticated).toBe(true);
  expect(user.user?.name).toBe('Demo Seeker');
  expect(user.spreadCredits).toBe(3);
  expect(user.sessionLoading).toBe(false);
});

test('интерпретация расклада возвращает текст', async () => {
  await loginDemo();
  const result = await store.dispatch(spreadApi.endpoints.interpretSpread.initiate(interpretBody)).unwrap();
  expect(result.interpretation.length).toBeGreaterThan(0);
});

test('интерпретация при дневном лимите отвечает 429', async () => {
  server.use(
    http.post('*/api/interpret', () =>
      HttpResponse.json(
        {
          code: 'daily_limit_reached',
          message: 'Лимит на сегодня исчерпан',
          tarotDaily: { used: 3, limit: 3, day: '2026-10-01' },
          spreadCredits: 0,
        },
        { status: 429 },
      ),
    ),
  );

  await expect(
    store.dispatch(spreadApi.endpoints.interpretSpread.initiate(interpretBody)).unwrap(),
  ).rejects.toMatchObject({
    status: 429,
    data: { code: 'daily_limit_reached' },
  });
});

test('история раскладов мапится из облачной записи', async () => {
  await loginDemo();
  const request = store.dispatch(spreadApi.endpoints.listSpreadsHistory.initiate({ limit: 20, offset: 0 }));
  const spreads = await request.unwrap();
  request.unsubscribe();

  expect(spreads[0]?.uid).toBe(DEMO_SPREAD_ID);
  expect(spreads[0]?.question).toBe('Как пройдёт день?');
});

test('избранное сохраняет карту', async () => {
  await loginDemo();
  await store.dispatch(favoritesApi.endpoints.addFavorite.initiate('the-fool')).unwrap();

  const request = store.dispatch(
    favoritesApi.endpoints.getFavorites.initiate(undefined, { forceRefetch: true }),
  );
  const favorites = await request.unwrap();
  request.unsubscribe();

  expect(favorites.cardIds).toContain('the-fool');
});

test('patch настроек меняет перевёрнутые карты', async () => {
  await loginDemo();
  await store
    .dispatch(settingsApi.endpoints.patchSettings.initiate({ spread: { hasReversed: false } }))
    .unwrap();

  const request = store.dispatch(
    settingsApi.endpoints.getSettings.initiate(undefined, { forceRefetch: true }),
  );
  const settings = await request.unwrap();
  request.unsubscribe();

  expect(settings.spread?.hasReversed).toBe(false);
});
