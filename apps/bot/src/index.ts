import { Bot, type Context } from 'grammy';
import { config } from './config';
import { startHealthServer } from './health';
import {
  ingestAcquisition,
  isTrackedStartPayload,
} from './acquisition';
import { parseSharedReadingStartPayload } from './sharedReading';
import {
  openMiniAppInlineKeyboard,
  openSharedReadingInlineKeyboard,
  mainReplyKeyboard,
  channelInlineKeyboard,
  faqInlineKeyboard,
  isFaqTopicId,
} from './keyboards';
import type { BotLang } from './lang';
import { resolveBotLang, webAppUrlWithLang } from './lang';
import {
  accountUnknownText,
  botCommandDescriptions,
  channelText,
  faqIntroText,
  faqTopics,
  helpText,
  lavaPaymentCancelledText,
  lavaPaymentFailedText,
  lavaPaymentSuccessText,
  matchesReplyBtn,
  MENU_BUTTON_TEXT,
  supportAcceptedText,
  supportFailedText,
  sharedReadingText,
  supportPromptText,
  welcomeText,
  CHANNEL_URL,
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

function langOf(ctx: Context): BotLang {
  return resolveBotLang(ctx.from?.language_code);
}

function fromMeta(ctx: Context) {
  const from = ctx.from;
  if (!from) {
    return null;
  }
  return {
    telegramId: from.id,
    username: from.username,
    displayName: [from.first_name, from.last_name].filter(Boolean).join(' '),
  };
}

async function trackStartIfNeeded(ctx: Context, payload: string): Promise<void> {
  if (!isTrackedStartPayload(payload)) {
    return;
  }
  const meta = fromMeta(ctx);
  if (!meta) {
    return;
  }
  try {
    await ingestAcquisition({
      ...meta,
      source: payload.trim().toLowerCase(),
    });
  } catch (error) {
    console.error('[bot] acquisition ingest failed:', error);
  }
}

/** Menu Button с ?lang= для этого чата — язык Mini App совпадает с ботом. */
async function configureUserMenuButton(
  ctx: Context,
  lang: BotLang,
): Promise<void> {
  const chatId = ctx.chat?.id;
  if (chatId == null) return;
  try {
    await ctx.api.setChatMenuButton({
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: MENU_BUTTON_TEXT[lang],
        web_app: { url: webAppUrlWithLang(config.webAppUrl, lang) },
      },
    });
  } catch (error) {
    console.warn('[bot] setChatMenuButton(chat) failed:', error);
  }
}

async function sendWelcome(ctx: Context, lang: BotLang): Promise<void> {
  await configureUserMenuButton(ctx, lang);
  await ctx.reply(welcomeText[lang], {
    parse_mode: 'Markdown',
    reply_markup: mainReplyKeyboard(lang),
  });
}

async function sendChannel(ctx: Context, lang: BotLang): Promise<void> {
  await ctx.reply(channelText[lang], {
    reply_markup: channelInlineKeyboard(lang),
  });
}

async function sendFaq(ctx: Context, lang: BotLang): Promise<void> {
  await ctx.reply(faqIntroText[lang], {
    reply_markup: faqInlineKeyboard(lang),
  });
}

async function sendHelp(ctx: Context, lang: BotLang): Promise<void> {
  await ctx.reply(helpText[lang], {
    parse_mode: 'Markdown',
    reply_markup: openMiniAppInlineKeyboard(lang),
  });
}

async function beginSupport(ctx: Context, lang: BotLang): Promise<void> {
  if (ctx.from?.id) {
    pendingSupportByUser.add(ctx.from.id);
  }
  await ctx.reply(supportPromptText[lang], { parse_mode: 'Markdown' });
}

bot.command('start', async (ctx) => {
  const payload = startPayload(ctx);
  const lang = langOf(ctx);
  const replyMarkup = openMiniAppInlineKeyboard(lang);

  await configureUserMenuButton(ctx, lang);

  if (payload === 'lava_success') {
    await ctx.reply(lavaPaymentSuccessText[lang], { reply_markup: replyMarkup });
    return;
  }
  if (payload === 'lava_failed') {
    await ctx.reply(lavaPaymentFailedText[lang], { reply_markup: replyMarkup });
    return;
  }
  if (payload === 'lava_cancelled') {
    await ctx.reply(lavaPaymentCancelledText[lang], {
      reply_markup: replyMarkup,
    });
    return;
  }

  // Шаринг расклада: `r_<hex32>`. Telegram доводит до бота, когда ссылка
  // `?startapp=` открыла чат (у бота не настроен Main Mini App) — отдаём
  // кнопку, которая открывает Mini App сразу на этом раскладе.
  const sharedReadingUid = parseSharedReadingStartPayload(payload);
  if (sharedReadingUid) {
    await ctx.reply(sharedReadingText[lang], {
      reply_markup: openSharedReadingInlineKeyboard(sharedReadingUid, lang),
    });
    return;
  }

  await trackStartIfNeeded(ctx, payload);
  await sendWelcome(ctx, lang);
});

bot.command('channel', async (ctx) => {
  await sendChannel(ctx, langOf(ctx));
});

bot.command('help', async (ctx) => {
  await sendHelp(ctx, langOf(ctx));
});

bot.command('support', async (ctx) => {
  await beginSupport(ctx, langOf(ctx));
});

bot.command('faq', async (ctx) => {
  await sendFaq(ctx, langOf(ctx));
});

bot.callbackQuery(/^faq:(.+)$/, async (ctx) => {
  const topic = ctx.match[1];
  const lang = langOf(ctx);
  await ctx.answerCallbackQuery();
  if (!isFaqTopicId(topic)) {
    return;
  }
  await ctx.reply(faqTopics[lang][topic], {
    reply_markup: faqInlineKeyboard(lang),
  });
});

bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  const text = ctx.message.text.trim();
  const lang = langOf(ctx);

  if (matchesReplyBtn(text, 'channel')) {
    await sendChannel(ctx, lang);
    return;
  }
  if (matchesReplyBtn(text, 'faq')) {
    await sendFaq(ctx, lang);
    return;
  }
  if (matchesReplyBtn(text, 'help')) {
    await sendHelp(ctx, lang);
    return;
  }
  if (matchesReplyBtn(text, 'support')) {
    await beginSupport(ctx, lang);
    return;
  }

  const from = ctx.from;
  if (!from) {
    await ctx.reply(accountUnknownText[lang]);
    return;
  }

  const awaitingSupport = pendingSupportByUser.has(from.id);
  if (!awaitingSupport) {
    await ctx.reply(helpText[lang], {
      parse_mode: 'Markdown',
      reply_markup: openMiniAppInlineKeyboard(lang),
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
    await ctx.reply(supportAcceptedText[lang], {
      parse_mode: 'Markdown',
      reply_markup: openMiniAppInlineKeyboard(lang),
    });
  } catch (error) {
    console.error('[bot] support ingest failed:', error);
    pendingSupportByUser.add(from.id);
    await ctx.reply(supportFailedText[lang], { parse_mode: 'Markdown' });
  }
});

async function configureDefaultMenuButton(): Promise<void> {
  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: MENU_BUTTON_TEXT.ru,
      web_app: { url: webAppUrlWithLang(config.webAppUrl, 'ru') },
    },
  });
}

async function configureLocalizedCommands(): Promise<void> {
  // Без language_code — дефолт (русский). Затем en/ru для клиентов Telegram.
  await bot.api.setMyCommands(botCommandDescriptions.ru);
  await bot.api.setMyCommands(botCommandDescriptions.ru, {
    language_code: 'ru',
  });
  await bot.api.setMyCommands(botCommandDescriptions.en, {
    language_code: 'en',
  });
}

async function main(): Promise<void> {
  console.log('[bot] starting…');
  startHealthServer(config.port);

  try {
    await configureLocalizedCommands();
    await configureDefaultMenuButton();
  } catch (error) {
    console.warn('[bot] menu/commands setup failed, continuing:', error);
  }

  bot.catch((err) => {
    console.error('[bot] unhandled error:', err);
  });

  const me = await bot.api.getMe();
  console.log(`[bot] @${me.username} — Mini App: ${config.webAppUrl}`);
  console.log(`[bot] channel: ${CHANNEL_URL}`);
  console.log('[bot] polling… (Ctrl+C to stop)');

  await bot.start();
}

main().catch((error) => {
  console.error('[bot] failed to start:', error);
  process.exit(1);
});
