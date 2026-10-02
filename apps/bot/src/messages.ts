import type { BotLang } from './lang';

export const CHANNEL_URL = 'https://t.me/mindfultarot';
export const CHANNEL_HANDLE = '@mindfultarot';

/** Текст кнопки Menu Button (должен совпадать с setChatMenuButton). */
export const MENU_BUTTON_TEXT: Record<BotLang, string> = {
  ru: 'Открыть Tarot',
  en: 'Open Tarot',
};

export const welcomeText: Record<BotLang, string> = {
  ru: `Привет! Я бот *Mindful Tarot*.

Приложение с раскладами, картой дня и словарём карт открывается кнопкой «Открыть Tarot» рядом с полем ввода.

Наш канал: [${CHANNEL_HANDLE}](${CHANNEL_URL}) — новости, подсказки и разборы.

Команды:
/start — приветствие и приложение
/channel — наш Telegram-канал
/faq — оплата, заряды и правила
/support — написать в поддержку
/help — список команд`,

  en: `Hi! I'm the *Mindful Tarot* bot.

The app with spreads, the card of the day, and the card dictionary opens via the “Open Tarot” button next to the message field.

Our channel: [${CHANNEL_HANDLE}](${CHANNEL_URL}) — news, tips, and readings.

Commands:
/start — welcome and the app
/channel — our Telegram channel
/faq — payments, credits, and rules
/support — contact support
/help — command list`,
};

export const helpText: Record<BotLang, string> = {
  ru: `*Команды бота*

/start — приветствие и быстрые кнопки
/channel — перейти в канал ${CHANNEL_HANDLE}
/faq — частые вопросы: оплата, заряды, правила
/support — написать в поддержку
/help — эта справка

Или используй кнопки меню внизу чата.

Приложение: таро-расклады, карта дня, библиотека карт.`,

  en: `*Bot commands*

/start — welcome and quick buttons
/channel — open channel ${CHANNEL_HANDLE}
/faq — FAQ: payments, credits, rules
/support — contact support
/help — this help

Or use the menu buttons below the chat.

App: tarot spreads, card of the day, card library.`,
};

export const channelText: Record<BotLang, string> = {
  ru: `Наш Telegram-канал: ${CHANNEL_HANDLE}

Там анонсы, короткие разборы и новости Mindful Tarot.

Открыть: ${CHANNEL_URL}`,

  en: `Our Telegram channel: ${CHANNEL_HANDLE}

Announcements, short readings, and Mindful Tarot news.

Open: ${CHANNEL_URL}`,
};

export const sharedReadingText: Record<BotLang, string> = {
  ru: `Тебе прислали расклад с толкованием.

Нажми кнопку ниже — он откроется в приложении.`,

  en: `Someone shared a reading with you.

Tap the button below to open it in the app.`,
};

/** Ежедневный nudge: бесплатный слот снова доступен (не заходили сегодня). */
/** Бесплатный слот обновился, платных зарядов нет (dailyFreeAvailableText в API = DAILY_FREE_RENEWED). */
export const dailyFreeAvailableText: Record<BotLang, string> = {
  ru: `Погадаем сегодня?

Бесплатный расклад снова доступен — дневной заряд обновился. Загляни в приложение.`,

  en: `Shall we do a reading today?

Your free daily spread is back — the free slot has refreshed. Open the app.`,
};

/** Есть платные заряды — мягкий хук без про бесплатный слот. */
export const dailyEngageText: Record<BotLang, string> = {
  ru: `Погадаем сегодня?

Открой Mindful Tarot — карты уже ждут.`,

  en: `Shall we do a reading today?

Open Mindful Tarot — the cards are waiting.`,
};

/** Одноразовый broadcast после деплоя: бесплатные дневные расклады доступны. */
export const dailyFreeBroadcastText: Record<BotLang, string> = {
  ru: `Погадаем сегодня?

В Mindful Tarot каждый день есть бесплатный расклад с толкованием — заряд уже обновился.`,

  en: `Shall we do a reading today?

Mindful Tarot gives you a free reading every day — your free slot is ready.`,
};

export const lavaPaymentSuccessText: Record<BotLang, string> = {
  ru: `Оплата прошла успешно. Заряды уже на балансе — можно вернуться в приложение.`,

  en: `Payment successful. Credits are already on your balance — you can return to the app.`,
};

export const lavaPaymentFailedText: Record<BotLang, string> = {
  ru: `Оплата не завершилась. Можно попробовать снова из приложения.`,

  en: `Payment didn’t go through. You can try again from the app.`,
};

export const lavaPaymentCancelledText: Record<BotLang, string> = {
  ru: `Оплата отменена. Когда будешь готов — купи кредиты снова в приложении.`,

  en: `Payment cancelled. When you’re ready, buy credits again in the app.`,
};

export const supportPromptText: Record<BotLang, string> = {
  ru: `*Поддержка Mindful Tarot*

Напиши одним сообщением, что случилось — я передам его команде.

Чтобы разобраться с первого ответа, добавь:
• что делал и что ожидал увидеть;
• когда это было — дата и примерное время;
• если про оплату — сумму и почту с чека;
• если про расклад — какой расклад и текст ошибки.

Ответ придёт сюда, в этот чат: отвечаем по будням, обычно в течение рабочего дня.

Пароли, коды из СМС и данные карты присылать не нужно — они нам не нужны никогда.`,

  en: `*Mindful Tarot support*

Send one message describing what happened — I’ll forward it to the team.

To help us reply faster, include:
• what you did and what you expected;
• when it happened — date and approximate time;
• for payments — amount and the email from the receipt;
• for a reading — which spread and the error text.

We’ll reply here in this chat on weekdays, usually within one business day.

Don’t send passwords, SMS codes, or card details — we never need them.`,
};

export const supportAcceptedText: Record<BotLang, string> = {
  ru: `*Обращение принято*

Передал его команде — ответ придёт сюда, в этот чат.

• Обычно отвечаем в течение рабочего дня (будни).
• Нужно что-то дополнить? Нажми «Поддержка» или /support и отправь ещё одно сообщение.
• Оплата, заряды и правила разобраны в /faq — иногда ответ находится там быстрее.

Пока ждёшь, приложение открывается кнопкой ниже.`,

  en: `*Request received*

I’ve forwarded it to the team — the reply will arrive here in this chat.

• We usually reply within one business day (weekdays).
• Need to add something? Tap “Support” or /support and send another message.
• Payments, credits, and rules are covered in /faq — sometimes the answer is there faster.

While you wait, open the app with the button below.`,
};

export const supportFailedText: Record<BotLang, string> = {
  ru: `*Сообщение не ушло*

Похоже, сервис на секунду недоступен — обращение не зарегистрировалось.

• Попробуй отправить тот же текст ещё раз через минуту.
• Если снова не выйдет — нажми /support и повтори отправку.
• Если проблема не уходит — загляни в канал ${CHANNEL_HANDLE}: о крупных сбоях мы пишем там.

Текст остался у тебя в чате выше — его можно скопировать и отправить заново.`,

  en: `*Message not sent*

The service seems briefly unavailable — your request wasn’t registered.

• Try sending the same text again in a minute.
• If it still fails — tap /support and resend.
• If it keeps failing — check channel ${CHANNEL_HANDLE}: we post about major outages there.

Your text is still in the chat above — you can copy and send it again.`,
};

export const faqIntroText: Record<BotLang, string> = {
  ru: `Частые вопросы Mindful Tarot

Выбери тему — коротко и по делу.`,

  en: `Mindful Tarot FAQ

Pick a topic — short and to the point.`,
};

export const accountUnknownText: Record<BotLang, string> = {
  ru: `Не удалось определить аккаунт Telegram. Напиши ещё раз.`,
  en: `Couldn’t identify your Telegram account. Please try again.`,
};

export type FaqTopicId = 'pay' | 'how' | 'credits' | 'rules' | 'delayed';

type FaqTopics = Record<FaqTopicId, string>;

const faqTopicsRu: FaqTopics = {
  pay: `Как купить заряды

1. Открой Mini App.
2. Нажми на молнию в шапке или «Купить заряды» в настройках.
3. Укажи email Яндекса — @yandex.ru / @ya.ru (на него Lava отправит чек).
4. Оплати на странице Lava.top картой РФ.

После оплаты Telegram вернёт тебя в бот. Заряды (+3) обычно появляются в течение 5 минут. Если баланс не обновился, закрой и снова открой приложение.

Сейчас на странице оплаты Lava чаще показывает карту. СБП зависит от кабинета Lava, не от приложения.`,

  how: `Как проходит оплата

Это цифровой пакет: +3 расклада сверх бесплатного дневного лимита.

• Платёж принимает Lava.top, не Telegram и не мы напрямую.
• Мы не видим номер карты и не храним его.
• Деньги списываются сразу. Заряды в приложении появляются после подтверждения от Lava (иногда с задержкой до ~5 минут).
• Чек уходит на указанный Яндекс-email.
• Если закрыл страницу до успеха — платёж мог не пройти. Попробуй снова из приложения, повторно не спишется, пока Lava не подтвердит оплату.`,

  credits: `Заряды и лимит

Каждый день есть бесплатные расклады (счётчик в шапке).
Когда дневной лимит кончился, списываются купленные заряды.

• Карта дня и «Да или нет» тоже тратят слот / заряд — как остальные расклады.
• Один успешный расклад с толкованием = один слот.
• Заряды не сгорают в полночь, дневной лимит обновляется каждый день.
• Если толкование не сгенерировалось из‑за ошибки сервиса, слот обычно возвращается.`,

  rules: `Правила сервиса

• Таро здесь — для рефлексии, не медицинский, юридический и не финансовый совет.
• Один аккаунт — для личного использования. Нельзя перепродавать доступ.
• Оплаченный пакет — цифровые заряды в приложении. Файлы на почту не приходят, доступ открывается в Mini App.
• Возврат: если заряды не зачислились в течение 24 часов после успешной оплаты — напиши сюда, разберёмся. Если заряды уже использованы на расклады, возврат не делаем.
• Нельзя использовать сервис для травли, обмана и запрещённого контента.
• Мы можем отказать в доступе при злоупотреблениях (накрутка, взлом, массовые аккаунты).`,

  delayed: `Не пришли заряды

1. Убедись, что оплата в Lava прошла (есть экран успеха или письмо).
2. Подожди до 5 минут — Lava иногда повторяет уведомление.
3. Закрой Mini App полностью и открой снова.
4. Проверь, что зашёл в тот же аккаунт, с которого нажимал «Купить».

Если прошло больше 15 минут — напиши в этот чат время оплаты и почту с чека (без паролей). Мы сверим платёж.`,
};

const faqTopicsEn: FaqTopics = {
  pay: `How to buy credits

1. Open the Mini App.
2. Tap the lightning icon in the header or “Buy credits” in Settings.
3. Enter a Yandex email — @yandex.ru / @ya.ru (Lava sends the receipt there).
4. Pay on the Lava.top page with a Russian bank card.

After payment Telegram brings you back to the bot. Credits (+3) usually appear within 5 minutes. If the balance didn’t update, close and reopen the app.

Lava’s checkout most often shows card payment. SBP depends on the Lava merchant settings, not on the app.`,

  how: `How payment works

This is a digital pack: +3 readings beyond the free daily limit.

• Payment is handled by Lava.top — not Telegram and not us directly.
• We never see or store your card number.
• Money is charged immediately. Credits appear in the app after Lava confirms (sometimes up to ~5 minutes).
• The receipt goes to the Yandex email you provided.
• If you closed the page before success, the payment may not have gone through. Try again from the app — you won’t be charged again until Lava confirms payment.`,

  credits: `Credits and daily limit

Every day you get free readings (counter in the header).
When the daily limit is used up, purchased credits are spent.

• Card of the day and “Yes or no” also use a slot / credit — like other spreads.
• One successful reading with an interpretation = one slot.
• Purchased credits don’t expire at midnight; the free daily limit resets each day.
• If interpretation failed because of a service error, the slot is usually refunded.`,

  rules: `Service rules

• Tarot here is for reflection — not medical, legal, or financial advice.
• One account is for personal use. Don’t resell access.
• A paid pack is digital credits in the app. No files arrive by email; access opens in the Mini App.
• Refunds: if credits weren’t credited within 24 hours after a successful payment — write here and we’ll sort it out. If credits were already used on readings, we don’t refund.
• Don’t use the service for harassment, fraud, or prohibited content.
• We may deny access for abuse (farming, hacking, mass accounts).`,

  delayed: `Credits didn’t arrive

1. Make sure Lava payment succeeded (success screen or email).
2. Wait up to 5 minutes — Lava sometimes retries the notification.
3. Fully close the Mini App and open it again.
4. Check you’re in the same account you used to buy.

If more than 15 minutes passed — write in this chat the payment time and the email from the receipt (no passwords). We’ll match the payment.`,
};

export const faqTopics: Record<BotLang, FaqTopics> = {
  ru: faqTopicsRu,
  en: faqTopicsEn,
};

/** Подписи кнопок FAQ (callback data те же: faq:pay и т.д.). */
export const faqButtonLabels: Record<
  BotLang,
  Record<FaqTopicId, string>
> = {
  ru: {
    pay: 'Как купить заряды',
    how: 'Как проходит оплата',
    credits: 'Заряды и лимит',
    rules: 'Правила сервиса',
    delayed: 'Не пришли заряды',
  },
  en: {
    pay: 'How to buy credits',
    how: 'How payment works',
    credits: 'Credits and limit',
    rules: 'Service rules',
    delayed: 'Credits didn’t arrive',
  },
};

export const openAppLabel: Record<BotLang, string> = {
  ru: '🔮 Открыть Mindful Tarot',
  en: '🔮 Open Mindful Tarot',
};

/** Кнопка возврата на страницу, с которой начали оплату. */
export const returnToAppLabel: Record<BotLang, string> = {
  ru: 'Вернуться в приложение',
  en: 'Return to the app',
};

export const openSharedReadingLabel: Record<BotLang, string> = {
  ru: '🔮 Открыть расклад',
  en: '🔮 Open reading',
};

export const channelOpenLabel: Record<BotLang, string> = {
  ru: `Открыть ${CHANNEL_HANDLE}`,
  en: `Open ${CHANNEL_HANDLE}`,
};

export const channelLinkLabel: Record<BotLang, string> = {
  ru: `Канал ${CHANNEL_HANDLE}`,
  en: `Channel ${CHANNEL_HANDLE}`,
};

export const BTN_LABELS = {
  channel: { ru: '📣 Канал', en: '📣 Channel' },
  faq: { ru: '❓ FAQ', en: '❓ FAQ' },
  support: { ru: '💬 Поддержка', en: '💬 Support' },
  help: { ru: 'ℹ️ Помощь', en: 'ℹ️ Help' },
} as const;

export type ReplyBtnKind = keyof typeof BTN_LABELS;

export function matchesReplyBtn(text: string, kind: ReplyBtnKind): boolean {
  return text === BTN_LABELS[kind].ru || text === BTN_LABELS[kind].en;
}

/** Описания команд для setMyCommands (по language_code). */
export const botCommandDescriptions: Record<
  BotLang,
  Array<{ command: string; description: string }>
> = {
  ru: [
    { command: 'start', description: 'Приветствие и приложение' },
    { command: 'channel', description: 'Наш Telegram-канал' },
    { command: 'faq', description: 'Оплата, заряды и правила' },
    { command: 'support', description: 'Написать в поддержку' },
    { command: 'help', description: 'Список команд' },
  ],
  en: [
    { command: 'start', description: 'Welcome and the app' },
    { command: 'channel', description: 'Our Telegram channel' },
    { command: 'faq', description: 'Payments, credits, and rules' },
    { command: 'support', description: 'Contact support' },
    { command: 'help', description: 'Command list' },
  ],
};
