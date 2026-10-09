import {
  buildWebAppDeepLink,
  sendTelegramMessage,
} from '../lib/telegramNotify';

/** 1 заряд / 3 заряда / 9 зарядов. */
function chargesWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'заряд';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заряда';
  return 'зарядов';
}

/** Уведомление в Telegram после успешной оплаты пакета зарядов. Ошибки — наружу (caller soft-fail). */
export async function notifyLavaPaymentSuccess(input: {
  telegramId: number;
  creditsAdded: number;
  spreadCredits: number;
  returnPath?: string | null;
}): Promise<void> {
  const deepLink = buildWebAppDeepLink(input.returnPath || '/spreads');
  const text =
    `Оплата прошла ✅ +${input.creditsAdded} ⚡ уже на балансе.\n\n` +
    `Сейчас у тебя ${input.spreadCredits} ${chargesWord(input.spreadCredits)}. ` +
    `Каждый заряд — расклад на твой вопрос с толкованием, уточнение к раскладу; ` +
    `глубокий разбор стоит 2 заряда.\n\n` +
    `Карты дня, недели и месяца по-прежнему бесплатны. Заряды не сгорают.`;

  await sendTelegramMessage({
    chatId: input.telegramId,
    text,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: '🔮 Сделать расклад',
            web_app: { url: deepLink },
          },
        ],
      ],
    },
  });
}
