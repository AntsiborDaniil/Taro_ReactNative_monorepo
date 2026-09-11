import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { isTelegramMiniAppClient } from './telegramBlock';

const root = document.getElementById('root');
if (!root) {
  throw new Error('root missing');
}

if (isTelegramMiniAppClient()) {
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#171F2C;color:#F4F4F5;font-family:sans-serif;padding:24px;text-align:center">
      <div>
        <h1 style="color:#F6C01B;font-size:22px">Админка недоступна в Telegram</h1>
        <p>Откройте панель в обычном браузере по адресу сайта /admin.<br/>Из Mini App вход закрыт.</p>
      </div>
    </div>
  `;
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
