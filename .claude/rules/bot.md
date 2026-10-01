---
paths:
  - "apps/bot/**"
---

# apps/bot — Telegram-бот (grammY)

- `src/index.ts` — создание бота, команды и хендлеры, запуск long polling и HTTP health-сервера (`health.ts`, `PORT`, по умолчанию 8080).
- `src/config.ts` — env (`TELEGRAM_BOT_TOKEN` обязателен и читается при импорте, `WEB_APP_URL`, `API_PUBLIC_URL`).
- `messages.ts` — все тексты бота; `keyboards.ts` — inline/reply-клавиатуры (кнопка Mini App на `WEB_APP_URL`); `faq.ts` — FAQ; `support.ts` — саппорт-тикеты (POST в API `/api/internal/support-tickets`, ответы админов из админки API отправляет через того же бота); `acquisition.ts` — метки источника из `/start <payload>`.
- Тексты отправляются с `parse_mode: 'Markdown'` (legacy: `*жирный*`, `_курсив_`, `` `код` ``, `[label](url)`): парные маркеры, в пользовательском вводе экранируй `_`, `*`, `[` и обратную кавычку. `tests/telegramText.ts` проверяет разметку, лимит 4096 символов и callback_data до 64 байт. Новые тексты — в `messages.ts` и покрывать тестом в `tests/messages.test.ts`.
- Тесты: `pnpm --filter tarot-telegram-bot exec vitest run` (`tests/*.test.ts`; `vitest.config.ts` подставляет фейковые env).
- Деплой: Timeweb, `apps/bot/Dockerfile` (npm внутри контейнера, контекст `apps/bot`).
