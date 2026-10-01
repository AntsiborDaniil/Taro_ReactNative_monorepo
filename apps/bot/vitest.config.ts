import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    /** config.ts требует токен на импорте — задаём до загрузки тестов. */
    env: {
      TELEGRAM_BOT_TOKEN: '123456:test-bot-token',
      WEB_APP_URL: 'https://app.example.test/',
      API_PUBLIC_URL: 'https://api.example.test',
    },
  },
});
