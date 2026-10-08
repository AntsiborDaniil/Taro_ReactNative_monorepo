import { describe, expect, it } from 'vitest';
import type { BotLang } from '../src/lang';
import { resolveBotLang, webAppUrlWithLang } from '../src/lang';
import {
  CHANNEL_HANDLE,
  CHANNEL_URL,
  MENU_BUTTON_TEXT,
  channelText,
  faqIntroText,
  faqTopics,
  helpText,
  lavaPaymentCancelledText,
  lavaPaymentFailedText,
  lavaPaymentSuccessText,
  matchesReplyBtn,
  sharedReadingText,
  dailyFreeAvailableText,
  dailyFreeBroadcastText,
  dailyEngageText,
  supportAcceptedText,
  supportFailedText,
  supportPromptText,
  welcomeText,
} from '../src/messages';
import {
  TELEGRAM_TEXT_LIMIT,
  collectCommands,
  collectLinks,
  countMarker,
  countStrayBrackets,
  hasBalancedMarkers,
} from './telegramText';

const LANGS: BotLang[] = ['ru', 'en'];

function allLocalized(
  record: Record<BotLang, string>,
): Array<[BotLang, string]> {
  return LANGS.map((lang) => [lang, record[lang]]);
}

/** Отправляются с parse_mode: 'Markdown' (см. src/index.ts). */
const MARKDOWN_RECORDS = {
  welcomeText,
  helpText,
  supportPromptText,
  supportAcceptedText,
  supportFailedText,
};

/** Отправляются без parse_mode — разметка в них не интерпретируется. */
const PLAIN_RECORDS = {
  channelText,
  faqIntroText,
  lavaPaymentSuccessText,
  lavaPaymentFailedText,
  lavaPaymentCancelledText,
  sharedReadingText,
  dailyFreeAvailableText,
  dailyFreeBroadcastText,
  dailyEngageText,
};

/** Все плоские тексты обоих языков для лимитов. */
const ALL_FLAT: Array<[string, string]> = [
  ...Object.entries(MARKDOWN_RECORDS).flatMap(([name, rec]) =>
    LANGS.map((lang) => [`${name}.${lang}`, rec[lang]] as [string, string]),
  ),
  ...Object.entries(PLAIN_RECORDS).flatMap(([name, rec]) =>
    LANGS.map((lang) => [`${name}.${lang}`, rec[lang]] as [string, string]),
  ),
  ...LANGS.flatMap((lang) =>
    Object.entries(faqTopics[lang]).map(
      ([id, text]) => [`faqTopics.${lang}.${id}`, text] as [string, string],
    ),
  ),
];

/** Команды, зарегистрированные в src/index.ts. */
const IMPLEMENTED_COMMANDS = ['start', 'channel', 'help', 'support', 'faq'];

describe('resolveBotLang', () => {
  it('ru* → ru', () => {
    expect(resolveBotLang('ru')).toBe('ru');
    expect(resolveBotLang('ru-RU')).toBe('ru');
  });

  it('не-ru → en', () => {
    expect(resolveBotLang('en')).toBe('en');
    expect(resolveBotLang('en-US')).toBe('en');
    expect(resolveBotLang('de')).toBe('en');
  });

  it('нет кода → ru', () => {
    expect(resolveBotLang(undefined)).toBe('ru');
    expect(resolveBotLang(null)).toBe('ru');
    expect(resolveBotLang('')).toBe('ru');
  });
});

describe('webAppUrlWithLang', () => {
  it('добавляет ?lang=', () => {
    const url = new URL(webAppUrlWithLang('https://example.com/app/', 'en'));
    expect(url.searchParams.get('lang')).toBe('en');
  });

  it('не ломает существующие query', () => {
    const url = new URL(
      webAppUrlWithLang('https://example.com/app/?x=1', 'ru'),
    );
    expect(url.searchParams.get('x')).toBe('1');
    expect(url.searchParams.get('lang')).toBe('ru');
  });
});

describe('лимиты Telegram', () => {
  it.each(ALL_FLAT)('%s укладывается в лимит сообщения', (_name, text) => {
    expect(text.length).toBeLessThanOrEqual(TELEGRAM_TEXT_LIMIT);
  });

  it.each(ALL_FLAT)('%s непустой', (_name, text) => {
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

describe('Markdown-разметка', () => {
  const markdownFlat = Object.entries(MARKDOWN_RECORDS).flatMap(([name, rec]) =>
    LANGS.map((lang) => [`${name}.${lang}`, rec[lang]] as [string, string]),
  );

  it.each(markdownFlat)('%s имеет парные маркеры разметки', (_name, text) => {
    expect(hasBalancedMarkers(text)).toBe(true);
  });

  it.each(markdownFlat)(
    '%s не использует ** (в legacy-Markdown жирный — это *текст*)',
    (_name, text) => {
      expect(text).not.toContain('**');
    },
  );

  it.each(markdownFlat)(
    '%s не содержит незакрытых квадратных скобок',
    (_name, text) => {
      expect(countStrayBrackets(text)).toBe(0);
    },
  );

  it('ссылки ведут на http(s)', () => {
    for (const [, text] of markdownFlat) {
      for (const link of collectLinks(text)) {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('подчёркивания в путях и словах не ломают курсив', () => {
    for (const [name, text] of markdownFlat) {
      expect(countMarker(text, '_') % 2, `${name}: непарный _`).toBe(0);
    }
  });
});

describe('справка и список команд', () => {
  it.each(LANGS)('welcomeText.%s перечисляет только существующие команды', (lang) => {
    for (const command of collectCommands(welcomeText[lang])) {
      expect(IMPLEMENTED_COMMANDS).toContain(command);
    }
  });

  it.each(LANGS)('helpText.%s перечисляет только существующие команды', (lang) => {
    for (const command of collectCommands(helpText[lang])) {
      expect(IMPLEMENTED_COMMANDS).toContain(command);
    }
  });

  it.each(LANGS)('helpText.%s описывает все команды бота', (lang) => {
    const documented = new Set(collectCommands(helpText[lang]));
    for (const command of IMPLEMENTED_COMMANDS) {
      expect(documented, `/${command} не описан в /help (${lang})`).toContain(
        command,
      );
    }
  });

  it('команда /app удалена из всех текстов', () => {
    for (const [name, text] of ALL_FLAT) {
      expect(collectCommands(text), `${name} ссылается на /app`).not.toContain(
        'app',
      );
    }
  });

  it.each(LANGS)('welcomeText.%s ведёт в канал через константы', (lang) => {
    expect(welcomeText[lang]).toContain(CHANNEL_HANDLE);
    expect(welcomeText[lang]).toContain(CHANNEL_URL);
  });

  it.each(LANGS)(
    'welcomeText.%s называет кнопку меню так же, как setChatMenuButton',
    (lang) => {
      expect(welcomeText[lang]).toContain(MENU_BUTTON_TEXT[lang]);
    },
  );
});

describe('тексты поддержки (ru)', () => {
  it('подсказка объясняет, что прислать', () => {
    expect(supportPromptText.ru).toMatch(/что делал/i);
    expect(supportPromptText.ru).toMatch(/дата/i);
  });

  it('подсказка предупреждает не присылать пароли и данные карты', () => {
    expect(supportPromptText.ru).toMatch(/парол/i);
    expect(supportPromptText.ru).toMatch(/карт/i);
  });

  it('подтверждение обещает ответ в этот же чат', () => {
    expect(supportAcceptedText.ru).toMatch(/в этот чат/i);
  });

  it('подтверждение подсказывает, как дополнить обращение', () => {
    expect(collectCommands(supportAcceptedText.ru)).toContain('support');
  });

  it('сообщение об ошибке предлагает повторить отправку', () => {
    expect(supportFailedText.ru).toMatch(/ещё раз|снова|повтори/i);
    expect(collectCommands(supportFailedText.ru)).toContain('support');
  });

  it('сообщение об ошибке говорит, что текст не потерян', () => {
    expect(supportFailedText.ru).toMatch(/скопировать|остался/i);
  });
});

describe('тексты поддержки (en)', () => {
  it('prompt asks for context and warns about secrets', () => {
    expect(supportPromptText.en).toMatch(/what you did/i);
    expect(supportPromptText.en).toMatch(/password/i);
    expect(supportPromptText.en).toMatch(/card/i);
  });

  it('accepted / failed point back to /support', () => {
    expect(collectCommands(supportAcceptedText.en)).toContain('support');
    expect(collectCommands(supportFailedText.en)).toContain('support');
  });
});

describe('FAQ', () => {
  const TOPIC_IDS = ['pay', 'how', 'credits', 'rules', 'delayed'];

  it.each(LANGS)('faqTopics.%s содержит ровно ожидаемый набор тем', (lang) => {
    expect(Object.keys(faqTopics[lang]).sort()).toEqual([...TOPIC_IDS].sort());
  });

  it.each(
    LANGS.flatMap((lang) =>
      Object.entries(faqTopics[lang]).map(
        ([id, text]) => [`${lang}.${id}`, text] as [string, string],
      ),
    ),
  )('тема %s содержательна', (_id, text) => {
    expect(text.length).toBeGreaterThan(150);
    expect(text.split('\n')[0].trim().length).toBeGreaterThan(0);
  });

  it('тема оплаты (ru) объясняет требование к email и Lava', () => {
    expect(faqTopics.ru.pay).toMatch(/yandex\.ru|ya\.ru/);
    expect(faqTopics.ru.pay).toMatch(/Lava/i);
    expect(faqTopics.ru.how).toMatch(/Lava/i);
  });

  it('тема оплаты (en) объясняет email и Lava', () => {
    expect(faqTopics.en.pay).toMatch(/yandex\.ru|ya\.ru/);
    expect(faqTopics.en.pay).toMatch(/Lava/i);
  });

  it('правила (ru) содержат дисклеймер и возврат', () => {
    expect(faqTopics.ru.rules).toMatch(/не медицинский/i);
    expect(faqTopics.ru.rules).toMatch(/финансов/i);
    expect(faqTopics.ru.rules).toMatch(/возврат/i);
  });

  it('rules (en) disclaimer and refunds', () => {
    expect(faqTopics.en.rules).toMatch(/medical/i);
    expect(faqTopics.en.rules).toMatch(/financial/i);
    expect(faqTopics.en.rules).toMatch(/refund/i);
  });

  it('лимит (ru) объясняет порядок списания', () => {
    expect(faqTopics.ru.credits).toMatch(/дневной лимит/i);
    expect(faqTopics.ru.credits).toMatch(/заряд/i);
  });

  it('delayed (ru) даёт порог ожидания', () => {
    expect(faqTopics.ru.delayed).toMatch(/\d+\s*минут/i);
  });
});

describe('платёжные уведомления', () => {
  it.each(LANGS)('успех.%s сообщает об успешной оплате', (lang) => {
    expect(lavaPaymentSuccessText[lang].toLowerCase()).toMatch(
      /успеш|success|баланс|balance/,
    );
  });

  it.each(allLocalized(lavaPaymentFailedText))(
    'неудача.%s предлагает повторить из приложения',
    (_lang, text) => {
      expect(text.toLowerCase()).toMatch(/app|приложени/);
    },
  );

  it.each(allLocalized(lavaPaymentCancelledText))(
    'отмена.%s предлагает купить снова из приложения',
    (_lang, text) => {
      expect(text.toLowerCase()).toMatch(/app|приложени/);
    },
  );
});

describe('daily-free уведомления', () => {
  it.each(allLocalized(dailyFreeAvailableText))(
    'nudge free.%s — карта дня + обновившийся ⚡',
    (_lang, text) => {
      expect(text.toLowerCase()).toMatch(/карта дня|card of the day/);
      expect(text).toContain('⚡');
      expect(text.toLowerCase()).not.toMatch(/погадаем|shall we/);
    },
  );

  it.each(allLocalized(dailyEngageText))(
    'nudge paid.%s — мягкий хук, без про бесплатный слот',
    (_lang, text) => {
      expect(text.toLowerCase()).toMatch(/карт[аыу]|card/);
      expect(text.toLowerCase()).not.toMatch(/погадаем|shall we|бесплатн|free slot|daily slot/);
    },
  );

  it.each(allLocalized(dailyFreeBroadcastText))(
    'broadcast.%s — карта дня + обновившийся ⚡',
    (_lang, text) => {
      expect(text.toLowerCase()).toMatch(/карта дня|card of the day/);
      expect(text).toContain('⚡');
      expect(text.toLowerCase()).not.toMatch(/погадаем|shall we/);
    },
  );
});

describe('reply-кнопки', () => {
  it('ru и en подписи распознаются', () => {
    expect(matchesReplyBtn('📣 Канал', 'channel')).toBe(true);
    expect(matchesReplyBtn('📣 Channel', 'channel')).toBe(true);
    expect(matchesReplyBtn('💬 Support', 'support')).toBe(true);
    expect(matchesReplyBtn('random', 'help')).toBe(false);
  });
});
