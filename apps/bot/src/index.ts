import { Bot } from 'grammy';
import { config } from './config';
import {
  openMiniAppInlineKeyboard,
  openMiniAppReplyKeyboard,
} from './keyboards';
import { helpText, openAppHintText, welcomeText } from './messages';

const bot = new Bot(config.botToken);

bot.command('start', async (ctx) => {
  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: openMiniAppInlineKeyboard(),
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

bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  await ctx.reply('Используй /app или кнопку ниже, чтобы открыть приложение.', {
    reply_markup: openMiniAppInlineKeyboard(),
  });
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
  await configureMenuButton();

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
