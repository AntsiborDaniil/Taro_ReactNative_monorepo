import { InlineKeyboard, Keyboard } from 'grammy';
import { config } from './config';
import { CHANNEL_HANDLE, CHANNEL_URL, type FaqTopicId } from './messages';

/** Inline / reply WebApp button label on /start and elsewhere. */
export const OPEN_APP_LABEL = 'Открыть Mindful Taro';
export const BTN_CHANNEL = '📣 Канал';
export const BTN_FAQ = '❓ FAQ';
export const BTN_SUPPORT = '💬 Поддержка';
export const BTN_HELP = 'ℹ️ Помощь';

export { CHANNEL_URL, CHANNEL_HANDLE };

/** Primary CTA on /start — opens Mini App. */
export function startOpenAppInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard().webApp(OPEN_APP_LABEL, config.webAppUrl);
}

export function openMiniAppInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(OPEN_APP_LABEL, config.webAppUrl)
    .row()
    .url(`Канал ${CHANNEL_HANDLE}`, CHANNEL_URL);
}

export function openMiniAppReplyKeyboard(): Keyboard {
  return new Keyboard()
    .webApp(OPEN_APP_LABEL, config.webAppUrl)
    .resized()
    .oneTime();
}

/** Persistent reply keyboard: quick actions (без кнопки приложения). */
export function mainReplyKeyboard(): Keyboard {
  return new Keyboard()
    .text(BTN_CHANNEL)
    .text(BTN_FAQ)
    .row()
    .text(BTN_SUPPORT)
    .text(BTN_HELP)
    .resized()
    .persistent();
}

export function channelInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .url(`Открыть ${CHANNEL_HANDLE}`, CHANNEL_URL)
    .row()
    .webApp(OPEN_APP_LABEL, config.webAppUrl);
}

export function faqInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Как купить заряды', 'faq:pay')
    .row()
    .text('Как проходит оплата', 'faq:how')
    .row()
    .text('Заряды и лимит', 'faq:credits')
    .row()
    .text('Правила сервиса', 'faq:rules')
    .row()
    .text('Не пришли заряды', 'faq:delayed')
    .row()
    .webApp(OPEN_APP_LABEL, config.webAppUrl);
}

export function isFaqTopicId(value: string): value is FaqTopicId {
  return (
    value === 'pay' ||
    value === 'how' ||
    value === 'credits' ||
    value === 'rules' ||
    value === 'delayed'
  );
}
