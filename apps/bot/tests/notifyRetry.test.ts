import { describe, expect, it, vi } from 'vitest';
import { isRetryableStatus, postInternalNotify } from '../src/dailyFreeNudge';
import { shouldReportInteraction } from '../src/subscribers';

const noSleep = async () => {};
const ok = (body: unknown, status = 202) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('postInternalNotify', () => {
  it('успех с первой попытки; передаёт секрет, signal и тело', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ accepted: true }));
    const res = await postInternalNotify('/api/x', { fetchImpl, sleep: noSleep, body: { a: 1 } });
    expect(res).toEqual({ accepted: true });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.test/api/x');
    expect((init.headers as Record<string, string>)['X-Support-Secret']).toBe('123456:test-bot-token');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.body).toBe('{"a":1}');
  });

  it('ретраит 5xx и сетевые ошибки с паузами, затем успех', async () => {
    const sleeps: number[] = [];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('cold', { status: 503 }))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(ok({ accepted: true }));
    const res = await postInternalNotify('/api/x', {
      fetchImpl,
      sleep: async (ms) => void sleeps.push(ms),
      retryDelaysMs: [10, 20],
    });
    expect(res).toEqual({ accepted: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([10, 20]);
  });

  it('после исчерпания попыток бросает последнюю ошибку', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => new Response('down', { status: 502 }));
    await expect(postInternalNotify('/api/x', { fetchImpl, sleep: noSleep })).rejects.toThrow(/502/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('4xx (кроме 408/429) не ретраится', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    await expect(postInternalNotify('/api/x', { fetchImpl, sleep: noSleep })).rejects.toThrow(/401/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('таймаут (AbortError) считается сетевой ошибкой и ретраится', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
      .mockResolvedValueOnce(ok({ accepted: true }));
    await postInternalNotify('/api/x', { fetchImpl, sleep: noSleep });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('isRetryableStatus', () => {
    expect([500, 503, 429, 408].every(isRetryableStatus)).toBe(true);
    expect([400, 401, 403, 404].some(isRetryableStatus)).toBe(false);
  });
});

describe('shouldReportInteraction', () => {
  it('не чаще раза в час на пользователя', () => {
    const store = new Map<number, number>();
    expect(shouldReportInteraction(1, 0, store)).toBe(true);
    expect(shouldReportInteraction(1, 1000, store)).toBe(false);
    expect(shouldReportInteraction(2, 1000, store)).toBe(true);
    expect(shouldReportInteraction(1, 3_600_001, store)).toBe(true);
  });
});
