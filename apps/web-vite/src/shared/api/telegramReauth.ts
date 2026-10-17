/**
 * Тихий (пере)вход Telegram Mini App по initData → POST /api/auth/telegram.
 *
 * Без импорта store/RTK: модуль вызывается из baseQuery (baseApi.ts) при 401 —
 * обычный fetch, чтобы не было цикла «запрос → 401 → вход через тот же baseQuery».
 *
 * initData берём из моста Telegram, а если мост ещё не загрузился или заблокирован —
 * из hash запуска (#tgWebAppData=…, Telegram кладёт его в URL сразу). Hash теряется
 * после навигации SPA, поэтому копия живёт в sessionStorage (на время открытия Mini App).
 */

const INIT_DATA_STORAGE_KEY = 'tgInitData';
const AUTH_URL = '/api/auth/telegram';

/** Паузы между попытками: суммарно ~90 с — хватает, чтобы Render (Free) проснулся. */
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 20000, 30000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initDataFromHash(): string {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    return new URLSearchParams(hash).get('tgWebAppData')?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Сохранить initData из hash запуска, пока SPA-навигация его не стёрла. */
export function rememberLaunchInitData(): void {
  if (typeof window === 'undefined') return;
  const fromHash = initDataFromHash();
  if (!fromHash) return;
  try {
    window.sessionStorage.setItem(INIT_DATA_STORAGE_KEY, fromHash);
  } catch {
    /* приватный режим — останется мост */
  }
}

/** initData текущего запуска: мост → hash → копия из sessionStorage. */
export function readTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  const fromBridge = window.Telegram?.WebApp?.initData?.trim();
  if (fromBridge) return fromBridge;
  const fromHash = initDataFromHash();
  if (fromHash) return fromHash;
  try {
    return window.sessionStorage.getItem(INIT_DATA_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Это запуск внутри Telegram (есть мост или initData запуска). */
export function isTelegramLaunch(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp) || Boolean(readTelegramInitData());
}

/** Мост грузится defer-скриптом: initData может появиться чуть позже старта. */
async function waitForInitData(timeoutMs: number): Promise<string> {
  const started = Date.now();
  for (;;) {
    const value = readTelegramInitData();
    if (value || Date.now() - started >= timeoutMs) return value;
    await sleep(100);
  }
}

type Attempt = 'ok' | 'invalid' | 'retry';

async function postTelegramAuth(initData: string): Promise<Attempt> {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Web-Cookie-Auth': '1' },
      body: JSON.stringify({ initData }),
    });
    if (response.ok) return 'ok';
    // 400/401 — initData отвергнут (подпись/срок 24 ч): повтор не поможет, нужен перезапуск Mini App.
    if (response.status === 400 || response.status === 401) return 'invalid';
    return 'retry';
  } catch {
    // Сеть/таймаут — обычно холодный старт Render.
    return 'retry';
  }
}

let inflight: Promise<boolean> | null = null;

/**
 * Войти заново по initData. Параллельные вызовы (несколько 401 разом, старт + возврат
 * в приложение) делят одну попытку. true — сессионная cookie выставлена.
 */
export function reauthTelegram(): Promise<boolean> {
  inflight ??= (async () => {
    const initData = await waitForInitData(3000);
    if (!initData) return false;
    for (let attempt = 0; ; attempt += 1) {
      const outcome = await postTelegramAuth(initData);
      if (outcome === 'ok') return true;
      const delay = RETRY_DELAYS_MS[attempt];
      if (outcome === 'invalid' || delay === undefined) return false;
      await sleep(delay);
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

rememberLaunchInitData();
