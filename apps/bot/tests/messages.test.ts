import { describe, expect, it } from 'vitest';
import {
  CHANNEL_HANDLE,
  CHANNEL_URL,
  channelText,
  faqIntroText,
  faqTopics,
  helpText,
  lavaPaymentCancelledText,
  lavaPaymentFailedText,
  lavaPaymentSuccessText,
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

/** Отправляются с parse_mode: 'Markdown' (см. src/index.ts). */
const MARKDOWN_TEXTS = {
  welcomeText,
  helpText,
  supportPromptText,
  supportAcceptedText,
  supportFailedText,
};

/** Отправляются без parse_mode — разметка в них не интерпретируется. */
const PLAIN_TEXTS = {
  channelText,
  faqIntroText,
  lavaPaymentSuccessText,
  lavaPaymentFailedText,
  lavaPaymentCancelledText,
  ...faqTopics,
};

const ALL_TEXTS = { ...MARKDOWN_TEXTS, ...PLAIN_TEXTS };

/** Команды, зарегистрированные в src/index.ts. */
const IMPLEMENTED_COMMANDS = ['start', 'channel', 'help', 'support', 'faq'];

describe('лимиты Telegram', () => {
  it.each(Object.entries(ALL_TEXTS))(
    '%s укладывается в лимит сообщения',
    (_name, text) => {
      expect(text.length).toBeLessThanOrEqual(TELEGRAM_TEXT_LIMIT);
    }
  );

  it.each(Object.entries(ALL_TEXTS))('%s непустой', (_name, text) => {
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

describe('Markdown-разметка', () => {
  it.each(Object.entries(MARKDOWN_TEXTS))(
    '%s имеет парные маркеры разметки',
    (_name, text) => {
      expect(hasBalancedMarkers(text)).toBe(true);
    }
  );

  it.each(Object.entries(MARKDOWN_TEXTS))(
    '%s не использует ** (в legacy-Markdown жирный — это *текст*)',
    (_name, text) => {
      expect(text).not.toContain('**');
    }
  );

  it.each(Object.entries(MARKDOWN_TEXTS))(
    '%s не содержит незакрытых квадратных скобок',
    (_name, text) => {
      expect(countStrayBrackets(text)).toBe(0);
    }
  );

  it('ссылки ведут на http(s)', () => {
    for (const text of Object.values(MARKDOWN_TEXTS)) {
      for (const link of collectLinks(text)) {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('подчёркивания в путях и словах не ломают курсив', () => {
    for (const [name, text] of Object.entries(MARKDOWN_TEXTS)) {
      expect(countMarker(text, '_') % 2, `${name}: непарный _`).toBe(0);
    }
  });
});

describe('справка и список команд', () => {
  it('welcomeText перечисляет только существующие команды', () => {
    for (const command of collectCommands(welcomeText)) {
      expect(IMPLEMENTED_COMMANDS).toContain(command);
    }
  });

  it('helpText перечисляет только существующие команды', () => {
    for (const command of collectCommands(helpText)) {
      expect(IMPLEMENTED_COMMANDS).toContain(command);
    }
  });

  it('helpText описывает все команды бота', () => {
    const documented = new Set(collectCommands(helpText));
    for (const command of IMPLEMENTED_COMMANDS) {
      expect(documented, `/${command} не описан в /help`).toContain(command);
    }
  });

  it('команда /app удалена из всех текстов', () => {
    for (const [name, text] of Object.entries(ALL_TEXTS)) {
      expect(collectCommands(text), `${name} ссылается на /app`).not.toContain(
        'app'
      );
    }
  });

  it('welcomeText ведёт в канал через константы', () => {
    expect(welcomeText).toContain(CHANNEL_HANDLE);
    expect(welcomeText).toContain(CHANNEL_URL);
  });

  it('welcomeText называет кнопку меню так же, как она создаётся в боте', () => {
    // src/index.ts: setChatMenuButton({ text: 'Открыть Tarot' })
    expect(welcomeText).toContain('Открыть Tarot');
  });
});

describe('тексты поддержки', () => {
  it('подсказка объясняет, что прислать', () => {
    expect(supportPromptText).toMatch(/что делал/i);
    expect(supportPromptText).toMatch(/дата/i);
  });

  it('подсказка предупреждает не присылать пароли и данные карты', () => {
    expect(supportPromptText).toMatch(/парол/i);
    expect(supportPromptText).toMatch(/карт/i);
  });

  it('подтверждение обещает ответ в этот же чат', () => {
    expect(supportAcceptedText).toMatch(/в этот чат/i);
  });

  it('подтверждение подсказывает, как дополнить обращение', () => {
    expect(collectCommands(supportAcceptedText)).toContain('support');
  });

  it('сообщение об ошибке предлагает повторить отправку', () => {
    expect(supportFailedText).toMatch(/ещё раз|снова|повтори/i);
    expect(collectCommands(supportFailedText)).toContain('support');
  });

  it('сообщение об ошибке говорит, что текст не потерян', () => {
    expect(supportFailedText).toMatch(/скопировать|остался/i);
  });
});

describe('FAQ', () => {
  const TOPIC_IDS = ['pay', 'how', 'credits', 'rules', 'delayed'];

  it('содержит ровно ожидаемый набор тем', () => {
    expect(Object.keys(faqTopics).sort()).toEqual([...TOPIC_IDS].sort());
  });

  it.each(Object.entries(faqTopics))('тема %s содержательна', (_id, text) => {
    expect(text.length).toBeGreaterThan(150);
    expect(text.split('\n')[0].trim().length).toBeGreaterThan(0);
  });

  it('тема оплаты объясняет требование к email', () => {
    expect(faqTopics.pay).toMatch(/yandex\.ru|ya\.ru/);
  });

  it('тема оплаты называет платёжного провайдера', () => {
    expect(faqTopics.pay).toMatch(/Lava/i);
    expect(faqTopics.how).toMatch(/Lava/i);
  });

  it('правила содержат дисклеймер: не медицинский и не финансовый совет', () => {
    expect(faqTopics.rules).toMatch(/не медицинский/i);
    expect(faqTopics.rules).toMatch(/финансов/i);
  });

  it('правила описывают условия возврата', () => {
    expect(faqTopics.rules).toMatch(/возврат/i);
  });

  it('тема про лимит объясняет порядок списания: сначала дневной, потом заряды', () => {
    expect(faqTopics.credits).toMatch(/дневной лимит/i);
    expect(faqTopics.credits).toMatch(/заряд/i);
  });

  it('тема про задержку даёт конкретный порог ожидания', () => {
    expect(faqTopics.delayed).toMatch(/\d+\s*минут/i);
  });
});

describe('платёжные уведомления', () => {
  it('успех сообщает о начислении зарядов', () => {
    expect(lavaPaymentSuccessText).toMatch(/заряд/i);
    expect(lavaPaymentSuccessText).toMatch(/\+\d/);
  });

  it('неудача и отмена предлагают повторить из приложения', () => {
    expect(lavaPaymentFailedText).toMatch(/приложени/i);
    expect(lavaPaymentCancelledText).toMatch(/приложени/i);
  });

  it('тексты про оплату не обещают возврат автоматически', () => {
    expect(lavaPaymentFailedText).not.toMatch(/вернём деньги/i);
  });
});
