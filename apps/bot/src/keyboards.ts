import { InlineKeyboard, Keyboard } from 'grammy';
import { config } from './config';
import type { BotLang } from './lang';
import { webAppUrlWithLang } from './lang';
import {
  BTN_LABELS,
  CHANNEL_HANDLE,
  CHANNEL_URL,
  channelLinkLabel,
  channelOpenLabel,
  faqButtonLabels,
  openAppLabel,
  openSharedReadingLabel,
  openTogetherLabel,
  returnToAppLabel,
  type FaqTopicId,
} from './messages';
import {
  buildSharedReadingWebAppUrl,
  buildTogetherWebAppUrl,
  type TogetherStartPayload,
} from './sharedReading';

export { CHANNEL_URL, CHANNEL_HANDLE };

/** WEB_APP_URL + внутренний путь Mini App + ?lang=. */
function webAppUrlWithReturnPath(
  path: string | null | undefined,
  lang: BotLang,
): string {
  const base = new URL(config.webAppUrl);
  const raw = (path || '/spreads').trim();
  const safe =
    raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('://')
      ? raw
      : '/spreads';
  const [pathnamePart, search = ''] = safe.split('?');
  base.pathname = pathnamePart || '/';
  if (search) {
    const extra = new URLSearchParams(search);
    extra.forEach((v, k) => base.searchParams.set(k, v));
  }
  base.searchParams.set('lang', lang);
  return base.toString();
}

export function openMiniAppInlineKeyboard(lang: BotLang): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(openAppLabel[lang], webAppUrlWithLang(config.webAppUrl, lang))
    .row()
    .url(channelLinkLabel[lang], CHANNEL_URL);
}

/** Открыть Mini App на том же пути, откуда пользователь ушёл на оплату. */
export function openReturnPathInlineKeyboard(
  path: string | null | undefined,
  lang: BotLang,
): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(returnToAppLabel[lang], webAppUrlWithReturnPath(path, lang))
    .row()
    .url(channelLinkLabel[lang], CHANNEL_URL);
}

/**
 * Кнопка открытия Mini App сразу на расшаренном раскладе — запасной путь, когда
 * ссылка `t.me/<bot>?startapp=r_…` открыла чат бота вместо приложения.
 */
export function openSharedReadingInlineKeyboard(
  readingUid: string,
  lang: BotLang,
): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(
      openSharedReadingLabel[lang],
      buildSharedReadingWebAppUrl(readingUid, lang),
    )
    .row()
    .url(channelLinkLabel[lang], CHANNEL_URL);
}

/** Кнопка «Открыть» для ссылки на пару / подарок: web_app сразу на /pair/:id или /gift/:id. */
export function openTogetherInlineKeyboard(
  link: TogetherStartPayload,
  lang: BotLang,
): InlineKeyboard {
  return new InlineKeyboard()
    .webApp(openTogetherLabel[link.kind][lang], buildTogetherWebAppUrl(link, lang))
    .row()
    .url(channelLinkLabel[lang], CHANNEL_URL);
}

/** Persistent reply keyboard: quick access to main actions / commands. */
export function mainReplyKeyboard(lang: BotLang): Keyboard {
  return new Keyboard()
    .webApp(openAppLabel[lang], webAppUrlWithLang(config.webAppUrl, lang))
    .row()
    .text(BTN_LABELS.channel[lang])
    .text(BTN_LABELS.faq[lang])
    .row()
    .text(BTN_LABELS.support[lang])
    .text(BTN_LABELS.help[lang])
    .resized()
    .persistent();
}

export function channelInlineKeyboard(lang: BotLang): InlineKeyboard {
  return new InlineKeyboard()
    .url(channelOpenLabel[lang], CHANNEL_URL)
    .row()
    .webApp(openAppLabel[lang], webAppUrlWithLang(config.webAppUrl, lang));
}

export function faqInlineKeyboard(lang: BotLang): InlineKeyboard {
  const labels = faqButtonLabels[lang];
  return new InlineKeyboard()
    .text(labels.pay, 'faq:pay')
    .row()
    .text(labels.how, 'faq:how')
    .row()
    .text(labels.credits, 'faq:credits')
    .row()
    .text(labels.rules, 'faq:rules')
    .row()
    .text(labels.delayed, 'faq:delayed')
    .row()
    .webApp(openAppLabel[lang], webAppUrlWithLang(config.webAppUrl, lang));
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
