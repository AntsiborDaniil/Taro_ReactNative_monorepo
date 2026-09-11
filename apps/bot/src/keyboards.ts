import { InlineKeyboard, Keyboard } from 'grammy';
import { config } from './config';
import type { FaqTopicId } from './messages';

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

