import { beforeEach, describe, expect, it, vi } from 'vitest';

// Memory-бэкенд: реестр подписчиков живёт в памяти, Supabase не нужен.
vi.mock('../src/lib/devMode', () => ({ useMemoryBackend: () => true }));

const sendMock = vi.fn();
vi.mock('../src/lib/telegramNotify', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/telegramNotify')>(
    '../src/lib/telegramNotify',
  );
  return { ...actual, sendTelegramMessage: (...args: unknown[]) => sendMock(...args) };
});

import { TelegramSendError } from '../src/lib/telegramNotify';
import { tarotSlotDay } from '../src/lib/tarotSlotDay';
import { classifyTelegramSendError } from '../src/lib/telegramSendErrors';
import {
  isPrimaryNudgeWindow,
  resolveNudgeLang,
  runDailyFreeNudges,
  sendWithRateLimit,
  shouldSendNudge,
} from '../src/services/dailyFreeNotifyService';
import {
  claimNudgeDay,
  recordSubscriberEvent,
  releaseNudgeClaim,
} from '../src/services/telegramSubscribersService';

const noSleep = async () => {};
// 11:00 МСК, день слота 2026-10-20 (основное окно: шлём всем).
const NOW = new Date('2026-10-20T08:00:00Z');
const DAY = '2026-10-20';

/** Подписчик, который «ещё не получал» рассылку (новый создаётся с сегодняшней отметкой). */
async function addSubscriber(id: number, lang = 'ru') {
  await recordSubscriberEvent({ telegramId: id, event: 'interaction', languageCode: lang });
  // Сбрасываем отметку нового подписчика: нужен кандидат.
  await releaseNudgeClaim(id, tarotSlotDay(), null);
}

describe('классификация ошибок Telegram', () => {
  it('403 и «bot was blocked» → blocked', () => {
    expect(classifyTelegramSendError(new TelegramSendError(403, 'Forbidden: bot was blocked by the user')).kind).toBe('blocked');
    expect(classifyTelegramSendError(new TelegramSendError(403, 'Forbidden: user is deactivated')).kind).toBe('blocked');
    expect(classifyTelegramSendError(new TelegramSendError(400, 'Bad Request: chat not found')).kind).toBe('blocked');
  });
  it('429 → rate_limit с retry_after', () => {
    expect(classifyTelegramSendError(new TelegramSendError(429, 'Too Many Requests', 7))).toEqual({
      kind: 'rate_limit',
      retryAfterMs: 7000,
    });
  });
  it('5xx и сетевые ошибки → retryable, прочие 4xx → permanent', () => {
    expect(classifyTelegramSendError(new TelegramSendError(502, 'bad gateway')).kind).toBe('retryable');
    expect(classifyTelegramSendError(new TypeError('fetch failed')).kind).toBe('retryable');
    expect(classifyTelegramSendError(new TelegramSendError(400, 'message is too long')).kind).toBe('permanent');
  });
});

describe('чистые функции рассылки', () => {
  it('язык: ru* → ru, иначе en, пусто → ru', () => {
    expect(resolveNudgeLang('ru')).toBe('ru');
    expect(resolveNudgeLang('ru-RU')).toBe('ru');
    expect(resolveNudgeLang('de')).toBe('en');
    expect(resolveNudgeLang(null)).toBe('ru');
  });
  it('основное окно 10–12 МСК шлёт всем, догоняющее — только с неиспользованным слотом', () => {
    expect(isPrimaryNudgeWindow(new Date('2026-10-20T07:00:05Z'))).toBe(true);
    expect(isPrimaryNudgeWindow(new Date('2026-10-20T10:00:00Z'))).toBe(false);
    expect(shouldSendNudge({ primary: true, used: 5, limit: 1 })).toBe(true);
    expect(shouldSendNudge({ primary: false, used: 1, limit: 1 })).toBe(false);
    expect(shouldSendNudge({ primary: false, used: 0, limit: 1 })).toBe(true);
  });
});

describe('sendWithRateLimit', () => {
  it('429 → ждёт retry_after и повторяет', async () => {
    const sleeps: number[] = [];
    const send = vi
      .fn()
      .mockRejectedValueOnce(new TelegramSendError(429, 'slow', 3))
      .mockResolvedValueOnce(undefined);
    const out = await sendWithRateLimit(send, async (ms) => void sleeps.push(ms));
    expect(out.ok).toBe(true);
    expect(sleeps).toEqual([3000]);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('постоянный 429 — сдаётся после лимита повторов', async () => {
    const send = vi.fn().mockRejectedValue(new TelegramSendError(429, 'slow', 1));
    const out = await sendWithRateLimit(send, noSleep);
    expect(out.ok).toBe(false);
    expect(send).toHaveBeenCalledTimes(4);
  });
});

describe('захват дня', () => {
  it('второй захват того же дня не проходит, после отката — проходит', async () => {
    await addSubscriber(710001);
    expect(await claimNudgeDay(710001, DAY)).toBe(true);
    expect(await claimNudgeDay(710001, DAY)).toBe(false);
    await releaseNudgeClaim(710001, DAY, null);
    expect(await claimNudgeDay(710001, DAY)).toBe(true);
  });
});

describe('runDailyFreeNudges', () => {
  beforeEach(() => sendMock.mockReset());

  it('шлёт подписчикам с языком, дубль при повторном прогоне не уходит', async () => {
    await addSubscriber(720001, 'ru');
    await addSubscriber(720002, 'de');
    sendMock.mockResolvedValue(undefined);

    const first = await runDailyFreeNudges({ now: NOW, sleep: noSleep });
    expect(first.sent).toBeGreaterThanOrEqual(2);
    const chats = sendMock.mock.calls.map((c) => (c[0] as { chatId: number }).chatId);
    expect(chats).toContain(720001);
    expect(chats).toContain(720002);
    const enCall = sendMock.mock.calls.find((c) => (c[0] as { chatId: number }).chatId === 720002)![0] as {
      replyMarkup: { inline_keyboard: Array<Array<{ web_app: { url: string } }>> };
    };
    expect(enCall.replyMarkup.inline_keyboard[0][0].web_app.url).toContain('lang=en');

    sendMock.mockClear();
    const second = await runDailyFreeNudges({ now: NOW, sleep: noSleep });
    expect(second.sent).toBe(0);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('параллельные прогоны не дублируют сообщения', async () => {
    await addSubscriber(730001);
    sendMock.mockResolvedValue(undefined);
    await Promise.all([
      runDailyFreeNudges({ now: new Date('2026-10-21T08:00:00Z'), sleep: noSleep }),
      runDailyFreeNudges({ now: new Date('2026-10-21T08:00:00Z'), sleep: noSleep }),
    ]);
    const to = sendMock.mock.calls.filter((c) => (c[0] as { chatId: number }).chatId === 730001);
    expect(to).toHaveLength(1);
  });

  it('403 → blocked и больше не шлём; сетевая ошибка → кандидат следующего прогона', async () => {
    await addSubscriber(740001);
    await addSubscriber(740002);
    const now = new Date('2026-10-22T08:00:00Z');
    sendMock.mockImplementation(async (input: { chatId: number }) => {
      if (input.chatId === 740001) throw new TelegramSendError(403, 'Forbidden: bot was blocked by the user');
      if (input.chatId === 740002) throw new TypeError('fetch failed');
    });
    const r1 = await runDailyFreeNudges({ now, sleep: noSleep });
    expect(r1.blocked).toBeGreaterThanOrEqual(1);
    expect(r1.failed).toBeGreaterThanOrEqual(1);

    sendMock.mockReset().mockResolvedValue(undefined);
    await runDailyFreeNudges({ now, sleep: noSleep });
    const chats = sendMock.mock.calls.map((c) => (c[0] as { chatId: number }).chatId);
    expect(chats).not.toContain(740001);
    expect(chats).toContain(740002);
  });

  it('вне окна 10–21 МСК ничего не шлёт', async () => {
    await addSubscriber(750001);
    const r = await runDailyFreeNudges({ now: new Date('2026-10-23T05:00:00Z'), sleep: noSleep });
    expect(r.sent + r.failed + r.blocked).toBe(0);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
