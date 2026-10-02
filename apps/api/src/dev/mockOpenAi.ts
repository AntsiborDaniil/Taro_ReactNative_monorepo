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
  input: TarotSpreadInput & { spread_key?: string }
): Promise<TarotInterpretationOutput> {
  await delay(MOCK_DELAY_MS);

  const key = (input.spread_key ?? '').toLowerCase();
  const isDay =
    key.includes('daysuggest') ||
    input.spread_type.toLowerCase().includes('совет дня') ||
    input.spread_type.toLowerCase().includes('daily advice');
  const card = input.positions[0]
    ? `${input.positions[0].card} (${input.positions[0].direction})`
    : '—';

  if (isDay) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] Сегодня карта ${card} предлагает заметить, где вы действуете на автомате и где можно замедлиться.\n\n` +
          `До вечера сделайте один маленький жест в эту сторону — и вечером отметьте, что изменилось в ощущении дня.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] Today’s card ${card} invites you to notice where you run on autopilot and where you can slow down.\n\n` +
        `Before evening, take one small action in that direction — then note what shifted in how the day felt.`,
    };
  }

  const cards = input.positions
    .map((p) => `${p.label}: ${p.card} (${p.direction})`)
    .join(', ');

  if (langIsRu(input.language)) {
    return {
      interpretation:
        `[DEV MOCK] По вопросу «${input.question || '—'}» расклад показывает конкретное напряжение, а не общий фон. ` +
        `Карты (${cards || 'нет'}) связывают ситуацию в одну линию: где вы уже видите правду и где ещё избегаете шага.\n\n` +
        `Сегодня имеет смысл сделать один ясный шаг в сторону того, что уже понятно — без ожидания идеального момента.`,
    };
  }

  return {
    interpretation:
      `[DEV MOCK] On “${input.question || '—'}”, the spread points to a concrete tension, not a vague vibe. ` +
      `Cards (${cards || 'none'}) form one line: where you already see the truth and where you still avoid a step.\n\n` +
      `Today, take one clear action toward what you already understand — without waiting for a perfect moment.`,
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

export async function mockGenerateFollowUp(input: {
  language: string;
  follow_up_question: string;
  spread_type?: string;
  question?: string;
  previous_interpretation?: string;
  positions?: unknown;
  spread_key?: string;
}): Promise<TarotInterpretationOutput> {
  await delay(Math.min(MOCK_DELAY_MS, 1200));

  if (langIsRu(input.language)) {
    return {
      interpretation:
        `[DEV MOCK] Уточнение «${input.follow_up_question || '—'}»: ` +
        `карты подсказывают мягкий следующий шаг и внимание к ощущениям прямо сейчас. ` +
        `Это короткая заглушка follow-up для локального UI.`,
    };
  }

  return {
    interpretation:
      `[DEV MOCK] Follow-up "${input.follow_up_question || '—'}": ` +
      `the cards point to a gentle next step and presence with what you feel now. ` +
      `This is a short follow-up stub for local UI.`,
  };
}
