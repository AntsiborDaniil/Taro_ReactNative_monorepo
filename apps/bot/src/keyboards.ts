import { InlineKeyboard, Keyboard } from 'grammy';
import { config } from './config.js';

const OPEN_APP_LABEL = '🔮 Открыть Mindful Tarot';

export function openMiniAppInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard().webApp(OPEN_APP_LABEL, config.webAppUrl);
}

export function openMiniAppReplyKeyboard(): Keyboard {
  return new Keyboard()
    .webApp(OPEN_APP_LABEL, config.webAppUrl)
    .resized()
    .oneTime();
}
