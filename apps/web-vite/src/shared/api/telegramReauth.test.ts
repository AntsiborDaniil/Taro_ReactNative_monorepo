import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { store } from '@app/store';
import { userApi } from '@entities/user/api';
import { baseApi } from '@shared/api/baseApi';
import { server } from './mocks/setup';
import { clearSession } from './mocks/state';
import { isTelegramLaunch, readTelegramInitData, reauthTelegram } from './telegramReauth';

const INIT_DATA = 'query_id=1&user=%7B%22id%22%3A42%7D&auth_date=1&hash=abc';

function launchFromTelegram() {
  window.history.replaceState(null, '', `/#tgWebAppData=${encodeURIComponent(INIT_DATA)}&tgWebAppVersion=8.0`);
}

beforeEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  window.sessionStorage.clear();
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.useRealTimers();
});

test('initData берётся из hash запуска и переживает уход hash (sessionStorage)', () => {
  launchFromTelegram();
  expect(readTelegramInitData()).toBe(INIT_DATA);
  window.sessionStorage.setItem('tgInitData', INIT_DATA);
  window.history.replaceState(null, '', '/spreads');
  expect(readTelegramInitData()).toBe(INIT_DATA);
  expect(isTelegramLaunch()).toBe(true);
});

test('вне Telegram 401 на /me остаётся 401 — перевхода нет', async () => {
  const request = store.dispatch(userApi.endpoints.authMe.initiate());
  await expect(request.unwrap()).rejects.toMatchObject({ status: 401 });
  request.unsubscribe();
  expect(store.getState().user.isAuthenticated).toBe(false);
});

test('проверка при открытии: /me без сессии → тихий вход по initData → пользователь авторизован', async () => {
  launchFromTelegram();
  const telegramCalls: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/api/auth/telegram')) telegramCalls.push(request.url);
  });

  const request = store.dispatch(userApi.endpoints.authMe.initiate());
  const session = await request.unwrap();
  request.unsubscribe();
  server.events.removeAllListeners();

  expect(session.user).toBeTruthy();
  expect(telegramCalls).toHaveLength(1);
  expect(store.getState().user.isAuthenticated).toBe(true);
});

test('сессия выпала посреди работы: любой 401 → перевход и повтор запроса', async () => {
  launchFromTelegram();
  const first = store.dispatch(userApi.endpoints.authMe.initiate());
  await first.unwrap();
  first.unsubscribe();

  clearSession(); // на сервере сессия пропала (истёк токен / cookie)
  const again = store.dispatch(userApi.endpoints.authMe.initiate(undefined, { forceRefetch: true }));
  const session = await again.unwrap();
  again.unsubscribe();
  expect(session.user).toBeTruthy();
  expect(store.getState().user.isAuthenticated).toBe(true);
});

test('холодный старт API: 5xx на входе → повторяет, пока не выйдет', async () => {
  launchFromTelegram();
  vi.useFakeTimers();
  let calls = 0;
  server.use(
    http.post('*/api/auth/telegram', () => {
      calls += 1;
      if (calls < 3) return HttpResponse.json({ message: 'Gateway timeout' }, { status: 504 });
      return HttpResponse.json({ user: { id: 'u' } });
    }),
  );
  const pending = reauthTelegram();
  await vi.advanceTimersByTimeAsync(10_000);
  await expect(pending).resolves.toBe(true);
  expect(calls).toBe(3);
});

test('initData отвергнут (401) — не долбим сервер повторами', async () => {
  launchFromTelegram();
  let calls = 0;
  server.use(
    http.post('*/api/auth/telegram', () => {
      calls += 1;
      return HttpResponse.json({ message: 'Invalid Telegram session' }, { status: 401 });
    }),
  );
  await expect(reauthTelegram()).resolves.toBe(false);
  expect(calls).toBe(1);
});

test('параллельные 401 делят одну попытку входа', async () => {
  launchFromTelegram();
  let calls = 0;
  server.use(
    http.post('*/api/auth/telegram', () => {
      calls += 1;
      return HttpResponse.json({ user: { id: 'u' } });
    }),
  );
  const results = await Promise.all([reauthTelegram(), reauthTelegram(), reauthTelegram()]);
  expect(results).toEqual([true, true, true]);
  expect(calls).toBe(1);
});
