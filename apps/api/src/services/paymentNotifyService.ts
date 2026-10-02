import {
  buildWebAppDeepLink,
  sendTelegramMessage,
} from '../lib/telegramNotify';

/** Уведомление в Telegram после успешной оплаты кредитов. Ошибки — наружу (caller soft-fail). */
export async function notifyLavaPaymentSuccess(input: {
  telegramId: number;
  creditsAdded: number;
  spreadCredits: number;
  returnPath?: string | null;
}): Promise<void> {
  const deepLink = buildWebAppDeepLink(input.returnPath || '/spreads');
  const text =
    `Оплата прошла успешно ✅\n\n` +
    `Начислено +${input.creditsAdded} заряда.\n` +
    `Баланс: ${input.spreadCredits}.`;

  await sendTelegramMessage({
    chatId: input.telegramId,
    text,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: 'Вернуться в приложение',
            web_app: { url: deepLink },
          },
        ],
      ],
    },
  });
}
