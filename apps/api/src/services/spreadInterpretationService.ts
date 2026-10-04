import OpenAI from 'openai';
import {
  TarotInterpretationOutput,
  TarotSpreadInput,
} from '../types';
import * as dotenv from 'dotenv';
import { useMockOpenAi } from '../lib/devMode';
import { mockGenerateFollowUp, mockGenerateInterpretation } from '../dev/mockOpenAi';
import { toOpenAiProviderError } from '../lib/openaiErrors';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Плотный разбор расклада: меньше воды, прямой ответ, повод вернуться. */
const spreadSystemPrompt = `
Ты таролог Mindful Tarot. Тон — спокойное наблюдение, не гадание и не «судьба».

ЗАДАЧА: ответить на вопрос клиента через весь расклад как одну картину.

ФОРМАТ (строго):
1) Первое предложение — прямой ответ по сути вопроса (без вступления и перефраза вопроса).
2) 1–2 коротких абзаца: что видно в ситуации, где напряжение / слепая зона, как карты связаны.
3) Финал одной фразой: конкретный шаг или вопрос к себе на сегодня.

ОБЪЁМ: 120–180 слов. 2–3 абзаца. Единый текст без списков, эмодзи и заголовков.

НЕЛЬЗЯ:
- начинать с «энергии», «вселенная», «карты говорят, что важно прислушаться»
- пересказывать вопрос своими словами
- перечислять карты по одной с учебными значениями
- предсказывать исход («точно будет / не будет»)
- медицина, юриспруденция, финансы как указания
- вода и общие пожелания без опоры на вопрос

Удерживай интерес: в тексте должно быть одно неочевидное наблюдение, из‑за которого хочется перечитать или уточнить.
Учитывай перевёрнутые карты как смещение смысла, не как «плохо».
`;

/** Совет дня: ровно пара абзацев — ритуал, не длинная консультация. */
const dayAdviceSystemPrompt = `
Ты таролог Mindful Tarot. Это «Совет дня» — одна карта на сегодня.

ТОН: приглашение к наблюдению в течение дня, не прогноз событий и не эзотерическая вода.

ФОРМАТ (строго):
Ровно 2 абзаца.
1) Что карта подсвечивает сегодня: конкретный фокус внимания / качество / напряжение (2–4 предложения).
2) Как прожить день с этим: один ясный жест или вопрос к себе до вечера (2–3 предложения).

ОБЪЁМ: 70–110 слов. Без списков, эмодзи, заголовков и вступления «сегодняшняя карта…».

НЕЛЬЗЯ: предсказания «что случится», общие мотивашки, пересказ учебника по карте, медицина/юриспруденция/финансы.
Учитывай, прямая карта или перевёрнутая.
`;

const followUpSystemPrompt = `
Ты таролог Mindful Tarot. Клиент уже получил разбор и задаёт уточнение.

ПРАВИЛА:
- 3–5 предложений, сразу по сути уточнения
- опирайся на уже данный разбор и карты; не повторяй их целиком
- единый текст без списков
- тон наблюдения, не пророчество
- без медицины, юриспруденции, финансовых указаний
- одно конкретное уточнение или шаг в финале
`;

export type InterpretSpreadInput = TarotSpreadInput & {
  /** Каталожный id, напр. simple_daySuggest — надёжнее локализованного названия. */
  spread_key?: string;
};

/** Да/Нет: тот же тон, но в финале — однозначный вердикт. */
const yesNoSystemPrompt = `
Ты таролог Mindful Tarot. Расклад «Да / Нет». Тон — спокойное наблюдение, не эзотерическая вода.

ЗАДАЧА: ответить на вопрос клиента через карту(ы) и в конце дать чёткий вердикт.

ФОРМАТ (строго):
1) 1–2 коротких абзаца: что видно по картам относительно вопроса (без перечисления карт «как в учебнике»).
2) Последняя строка ответа — обязательно одна из фраз (на языке ответа клиента):
   - «Ответ: Да.»
   - «Ответ: Нет.»
   - «Ответ: Скорее да.»
   - «Ответ: Скорее нет.»
   Для English: "Answer: Yes." / "Answer: No." / "Answer: Likely yes." / "Answer: Likely no."

ОБЪЁМ: 80–140 слов до финальной строки. Единый текст без списков, эмодзи и заголовков.

НЕЛЬЗЯ: уходить от вердикта («карты не дают ответа»), общие пожелания, медицина/юриспруденция/финансы.
Учитывай перевёрнутые карты как смещение смысла, не как автоматическое «Нет».
`;

/** Утро / день / вечер: три коротких такта, как «Совет дня», но на весь день. */
const dayPartsSystemPrompt = `
Ты таролог Mindful Tarot. Это расклад «Утро, день, вечер» — ритуал дня из трёх карт.

ТОН: приглашение к наблюдению в течение дня, не прогноз событий и не эзотерическая вода.

ФОРМАТ (строго):
Три коротких такта — утро, день, вечер (можно тремя короткими абзацами).
Каждый такт: куда направить внимание в этой части дня (1–3 предложения).
Финал не нужен отдельно: вечерний такт замыкает день жестом или вопросом к себе.

ОБЪЁМ: 90–140 слов. Без списков-маркеров, эмодзи, заголовков и вступления «сегодняшние карты…».

НЕЛЬЗЯ: предсказания «что случится», общие мотивашки, пересказ учебника по картам, медицина/юриспруденция/финансы.
Учитывай, прямая карта или перевёрнутая.
`;

const SPREAD_EXTRA_PROMPTS: { match: string; extra: string }[] = [
  {
    match: 'boundaries',
    extra: `
Расклад «Границы». Фокус: агентность клиента, формулировка границы и цена молчания.
Не винить того, кто уступает, и не подталкивать к «просто уйди» по умолчанию.
Не предсказывать исход конфликта. Закончить конкретным словом или жестом границы на сегодня.
`.trim(),
  },
  {
    match: 'betweenus',
    extra: `
Расклад «Между нами». Смотри на динамику СЕЙЧАС, не на будущее брака и не на «вернётся ли».
Не выноси вердикт «он любит / не любит». Один честный следующий шаг в финале.
`.trim(),
  },
  {
    match: 'stayorgo',
    extra: `
Расклад «Остаться или уйти». Вопрос — обычный текст о ситуации, не формула.
Сам выдели два пути (остаться и уйти) из того, что написал человек.
Сравни цены и то, кем человек становится на каждом пути.
Заверши, какой путь ближе СЕГОДНЯ, не судьбой и не «правильным навсегда».
`.trim(),
  },
  {
    match: 'dayparts',
    extra: `
Не предсказывай события дня. Три такта — ритуал внимания: утро, день, вечер.
`.trim(),
  },
  {
    match: 'inmyhands',
    extra: `
Расклад «Что я могу контролировать». Жёстко раздели: что в руках клиента и что нет.
Одна конкретная граница на сегодня. Не призывать контролировать других или исход.
`.trim(),
  },
];

function getSpreadExtraPrompt(spread_key?: string): string | undefined {
  const key = (spread_key ?? '').toLowerCase();
  if (!key) return undefined;
  return SPREAD_EXTRA_PROMPTS.find((item) => key.includes(item.match))?.extra;
}

function isDayAdvice(input: InterpretSpreadInput): boolean {
  const key = (input.spread_key ?? '').toLowerCase();
  if (key === 'simple_daysuggest' || key.includes('daysuggest') || key.includes('day_advice')) {
    return true;
  }
  if (input.positions.length !== 1) return false;
  const type = input.spread_type.trim().toLowerCase();
  return (
    type.includes('совет дня') ||
    type.includes('daily advice') ||
    type.includes('day advice')
  );
}

function isYesNoSpread(input: InterpretSpreadInput): boolean {
  const key = (input.spread_key ?? '').toLowerCase();
  if (
    key === 'simple_yesno' ||
    key.includes('yesno') ||
    key.includes('yes_no') ||
    key.includes('данет')
  ) {
    return true;
  }
  const type = input.spread_type.trim().toLowerCase();
  return (
    type.includes('да/нет') ||
    type.includes('да — нет') ||
    type.includes('да-нет') ||
    type.includes('yes/no') ||
    type.includes('yes or no') ||
    type.includes('yes-no')
  );
}

function isDayPartsSpread(input: InterpretSpreadInput): boolean {
  const key = (input.spread_key ?? '').toLowerCase();
  return key === 'simple_dayparts' || key.includes('dayparts');
}

function formatPositions(positions: TarotSpreadInput['positions']): string {
  return positions
    .map((p) => {
      const orient = p.direction === 'upright' || p.direction === 'Прямая' ? 'прямая' : 'перевёрнутая';
      const label = p.label?.trim() ? `${p.label}: ` : '';
      return `${label}${p.card} (${orient})`;
    })
    .join('\n');
}

export async function generateInterpretation(
  input: InterpretSpreadInput
): Promise<TarotInterpretationOutput> {
  const { spread_type, positions, language, question, spread_key } = input;

  if (useMockOpenAi()) {
    return mockGenerateInterpretation({
      spread_type,
      positions,
      language,
      question,
      spread_key,
    });
  }

  const dayAdvice = isDayAdvice(input);
  const dayParts = !dayAdvice && isDayPartsSpread(input);
  const yesNo = !dayAdvice && !dayParts && isYesNoSpread(input);
  const extra = getSpreadExtraPrompt(spread_key);
  const baseSystem = dayAdvice
    ? dayAdviceSystemPrompt
    : dayParts
      ? dayPartsSystemPrompt
      : yesNo
        ? yesNoSystemPrompt
        : spreadSystemPrompt;
  const system = extra ? `${baseSystem}\n\n${extra}` : baseSystem;

  const content = dayAdvice
    ? `
Режим: Совет дня (одна карта).
Карта: ${formatPositions(positions)}
Язык ответа: ${language}

Напиши ровно два абзаца по правилам system.
`
    : dayParts
      ? `
Режим: Утро, день, вечер (три карты — ритуал дня).
${spread_key ? `Ключ расклада: ${spread_key}` : ''}

Карты:
${formatPositions(positions)}

Язык ответа: ${language}

Напиши три коротких такта (утро / день / вечер) по правилам system.
`
    : yesNo
      ? `
Режим: Да / Нет.
ВОПРОС КЛИЕНТА: "${question.trim() || '(вопрос не задан — сформулируй вердикт по посланию карт)'}"

Тип расклада: ${spread_type}
${spread_key ? `Ключ расклада: ${spread_key}` : ''}

Карты:
${formatPositions(positions)}

Язык ответа: ${language}

Дай краткий разбор и заверши обязательной строкой «Ответ: …» по правилам system.
`
      : `
ВОПРОС КЛИЕНТА: "${question.trim() || '(вопрос не задан — ответь на главное послание расклада без общих пожеланий)'}"

Тип расклада: ${spread_type}
${spread_key ? `Ключ расклада: ${spread_key}` : ''}

Карты в позициях:
${formatPositions(positions)}

Язык ответа: ${language}

Ответь на вопрос через весь расклад. Не описывай карты по отдельности.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      temperature: dayAdvice || dayParts ? 0.55 : yesNo ? 0.5 : 0.6,
      max_tokens: dayAdvice ? 280 : dayParts ? 360 : yesNo ? 360 : 480,
    });

    return {
      interpretation: completion.choices[0]?.message?.content ?? '',
    };
  } catch (error) {
    throw toOpenAiProviderError(error) ?? error;
  }
}

export type TarotFollowUpInput = InterpretSpreadInput & {
  previous_interpretation: string;
  follow_up_question: string;
};

/** Короткий follow-up к уже готовому толкованию; кап токенов защищает маржу. */
export async function generateFollowUp({
  spread_type,
  positions,
  language,
  question,
  previous_interpretation,
  follow_up_question,
  spread_key,
}: TarotFollowUpInput): Promise<TarotInterpretationOutput> {
  if (useMockOpenAi()) {
    return mockGenerateFollowUp({
      spread_type,
      positions,
      language,
      question,
      previous_interpretation,
      follow_up_question,
      spread_key,
    });
  }

  const content = `
Изначальный вопрос: "${question}"
Тип расклада: ${spread_type}
Карты:
${formatPositions(positions)}

Предыдущее толкование:
${previous_interpretation}

Уточнение:
"${follow_up_question.trim()}"

Язык ответа: ${language}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: followUpSystemPrompt },
        { role: 'user', content },
      ],
      temperature: 0.55,
      max_tokens: 320,
    });

    return {
      interpretation: completion.choices[0]?.message?.content ?? '',
    };
  } catch (error) {
    throw toOpenAiProviderError(error) ?? error;
  }
}
