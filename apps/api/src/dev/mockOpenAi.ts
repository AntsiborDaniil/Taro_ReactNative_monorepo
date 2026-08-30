import type {
  TarotSpreadInput,
  TarotInterpretationOutput,
  TMoodAndEnergyInput,
  TMoodAndEnergyOutput,
  THabitsInput,
} from '../types';

const MOCK_DELAY_MS = Number(process.env.MOCK_OPENAI_DELAY_MS?.trim() || '3200');

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function langIsRu(language: string): boolean {
  return language.toLowerCase().startsWith('ru');
}

/** Mock interpret with delay so fullscreen AI loader UI can be reviewed locally. */
export async function mockGenerateInterpretation(
  input: TarotSpreadInput
): Promise<TarotInterpretationOutput> {
  await delay(MOCK_DELAY_MS);

  const cards = input.positions
    .map((p) => `${p.label}: ${p.card} (${p.direction})`)
    .join(', ');

  if (langIsRu(input.language)) {
    return {
      interpretation:
        `[DEV MOCK] Вопрос: «${input.question || '—'}». ` +
        `Расклад «${input.spread_type}» с картами (${cards || 'нет карт'}) ` +
        `говорит о внимании к текущему моменту и мягком следующем шаге. ` +
        `Это заглушка OpenAI для локального UI — реальный текст появится с OPENAI_API_KEY.`,
    };
  }

  return {
    interpretation:
      `[DEV MOCK] Question: "${input.question || '—'}". ` +
      `Spread "${input.spread_type}" with cards (${cards || 'none'}) ` +
      `points to presence and a gentle next step. ` +
      `This is an OpenAI stub for local UI — set OPENAI_API_KEY for real text.`,
  };
}

export async function mockGenerateMoodAndEnergy(
  input: TMoodAndEnergyInput
): Promise<TMoodAndEnergyOutput> {
  await delay(MOCK_DELAY_MS);
  const { mood, energy, stress } = input.params;
  const card = `${input.card.card} (${input.card.direction})`;

  if (langIsRu(input.language)) {
    return {
      interpretation:
        `[DEV MOCK] Настроение ${mood}/10, энергия ${energy}/10, стресс ${stress}/10. ` +
        `Карта ${card} отражает это состояние и предлагает восстановить баланс небольшим ритуалом заботы о себе.`,
    };
  }

  return {
    interpretation:
      `[DEV MOCK] Mood ${mood}/10, energy ${energy}/10, stress ${stress}/10. ` +
      `Card ${card} mirrors this state and suggests restoring balance with a small self-care ritual.`,
  };
}

export async function mockGenerateHabits(
  input: THabitsInput
): Promise<TMoodAndEnergyOutput> {
  await delay(MOCK_DELAY_MS);
  const good = input.params?.goodHabits?.join(', ') || '—';
  const bad = input.params?.badHabits?.join(', ') || '—';
  const card = `${input.card.card} (${input.card.direction})`;

  if (langIsRu(input.language)) {
    return {
      interpretation:
        `[DEV MOCK] Карта ${card} поддерживает привычки «${good}» ` +
        `и мягко указывает отпустить «${bad}». Начните с одного маленького действия сегодня.`,
    };
  }

  return {
    interpretation:
      `[DEV MOCK] Card ${card} supports habits "${good}" ` +
      `and gently points to releasing "${bad}". Start with one small action today.`,
  };
}
