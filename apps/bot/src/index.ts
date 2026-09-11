import { Bot } from 'grammy';
import { config } from './config';
import { startHealthServer } from './health';
import {
  openMiniAppInlineKeyboard,
  openMiniAppReplyKeyboard,
  faqInlineKeyboard,
  isFaqTopicId,
} from './keyboards';
import {
  faqIntroText,
  faqTopics,
  helpText,
  lavaPaymentCancelledText,
  lavaPaymentFailedText,
  lavaPaymentSuccessText,
  openAppHintText,
  welcomeText,
} from './messages';
import { ingestSupportTicket } from './support';

const bot = new Bot(config.botToken);

/** Users who pressed /support and should send the next text as a ticket. */
const pendingSupportByUser = new Set<number>();

function startPayload(ctx: { match?: string | RegExpMatchArray }): string {
  if (typeof ctx.match === 'string') {
    return ctx.match.trim();
  }
  return '';
}

bot.command('start', async (ctx) => {
  const payload = startPayload(ctx);
  const replyMarkup = openMiniAppInlineKeyboard();

  if (payload === 'lava_success') {
    await ctx.reply(lavaPaymentSuccessText, { reply_markup: replyMarkup });
    return;
  }
  if (payload === 'lava_failed') {
    await ctx.reply(lavaPaymentFailedText, { reply_markup: replyMarkup });
    return;
  }
  if (payload === 'lava_cancelled') {
    await ctx.reply(lavaPaymentCancelledText, { reply_markup: replyMarkup });
    return;
  }

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: replyMarkup,
  });
});

bot.command('app', async (ctx) => {
  await ctx.reply(openAppHintText, {
    reply_markup: openMiniAppReplyKeyboard(),
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: openMiniAppInlineKeyboard(),
  });
});

bot.command('support', async (ctx) => {
  if (ctx.from?.id) {
    pendingSupportByUser.add(ctx.from.id);
  }
  await ctx.reply(
    'Напиши одним сообщением, что случилось — оплата, заряды, ошибка в раскладе. Текст уйдёт в поддержку, ответ придёт сюда в бот.'
  );
});

bot.command('faq', async (ctx) => {
  await ctx.reply(faqIntroText, {
    reply_markup: faqInlineKeyboard(),
  });
});

bot.callbackQuery(/^faq:(.+)$/, async (ctx) => {
  const topic = ctx.match[1];
  await ctx.answerCallbackQuery();
  if (!isFaqTopicId(topic)) {
    return;
  }
  await ctx.reply(faqTopics[topic], {
    reply_markup: faqInlineKeyboard(),
  });
});

bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  const from = ctx.from;
  if (!from) {
    await ctx.reply('Не удалось определить аккаунт Telegram. Напиши ещё раз.');
    return;
  }

  const awaitingSupport = pendingSupportByUser.has(from.id);
  if (!awaitingSupport) {
    await ctx.reply(helpText, {
      parse_mode: 'Markdown',
      reply_markup: openMiniAppInlineKeyboard(),
    });
    return;
  }

  pendingSupportByUser.delete(from.id);

  try {
    await ingestSupportTicket({
      telegramId: from.id,
      username: from.username,
      displayName: [from.first_name, from.last_name].filter(Boolean).join(' '),
      message: ctx.message.text,
    });
    await ctx.reply(
      'Приняли обращение. Ответим здесь в боте. Пока можно открыть приложение кнопкой ниже.',
      { reply_markup: openMiniAppInlineKeyboard() }
    );
  } catch (error) {
    console.error('[bot] support ingest failed:', error);
    pendingSupportByUser.add(from.id);
    await ctx.reply(
      'Сейчас не получилось отправить сообщение в поддержку. Попробуй ещё раз через минуту или напиши /support.'
    );
  }
});

async function configureMenuButton(): Promise<void> {
  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Открыть Tarot',
      web_app: { url: config.webAppUrl },
    },
  });
}

async function main(): Promise<void> {
  console.log('[bot] starting…');
  startHealthServer(config.port);

  try {
    await bot.api.setMyCommands([
      { command: 'start', description: 'Приветствие и приложение' },
      { command: 'app', description: 'Открыть Mini App' },
      { command: 'faq', description: 'Оплата, заряды и правила' },
      { command: 'support', description: 'Написать в поддержку' },
      { command: 'help', description: 'Список команд' },
    ]);
    await configureMenuButton();
  } catch (error) {
    console.warn('[bot] setChatMenuButton failed, continuing:', error);
  }

  bot.catch((err) => {
    console.error('[bot] unhandled error:', err);
  });

  const me = await bot.api.getMe();
  console.log(`[bot] @${me.username} — Mini App: ${config.webAppUrl}`);
  console.log('[bot] polling… (Ctrl+C to stop)');

  await bot.start();
}

main().catch((error) => {
  console.error('[bot] failed to start:', error);
  process.exit(1);
});
