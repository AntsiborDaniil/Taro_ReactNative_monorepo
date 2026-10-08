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
  input: TarotSpreadInput & { spread_key?: string; mode?: 'deep' }
): Promise<TarotInterpretationOutput> {
  await delay(MOCK_DELAY_MS);

  const key = (input.spread_key ?? '').toLowerCase();
  const isDay =
    key.includes('daysuggest') ||
    input.spread_type.toLowerCase().includes('совет дня') ||
    input.spread_type.toLowerCase().includes('daily advice');
  const isYesNo =
    key.includes('yesno') ||
    key.includes('yes_no') ||
    input.spread_type.toLowerCase().includes('да/нет') ||
    input.spread_type.toLowerCase().includes('yes/no');
  const card = input.positions[0]
    ? `${input.positions[0].card} (${input.positions[0].direction})`
    : '—';

  if (key === 'period_weekcard' || key === 'period_monthcard') {
    const week = key === 'period_weekcard';
    const ru = langIsRu(input.language);
    return {
      interpretation: ru
        ? `[DEV MOCK] Карта ${card} задаёт тему ${week ? 'недели' : 'месяца'}: меньше спешки, больше внимания к тому, что уже работает.\n\n` +
          `Сильнее всего это проявится в делах и в отношениях с близкими — замечай, где ты выбираешь по привычке.\n\n` +
          `Намерение на ${week ? 'неделю' : 'месяц'}: делать одно дело за раз и доводить его до конца.`
        : `[DEV MOCK] ${card} sets the theme of the ${week ? 'week' : 'month'}: less rush, more attention to what already works.\n\n` +
          `It shows most at work and with people close to you — notice where you choose out of habit.\n\n` +
          `Intention for the ${week ? 'week' : 'month'}: one thing at a time, carried through.`,
    };
  }

  if (isDay) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] Сегодня карта ${card} предлагает заметить, где вы действуете на автомате и где можно замедлиться.\n\n` +
          `Сильнее всего это звучит в делах и в общении: замечайте моменты, когда отвечаете по привычке, а не по выбору.\n\n` +
          `Шаг на сегодня: до вечера сделайте один маленький жест в эту сторону — и вечером отметьте, что изменилось в ощущении дня.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] Today’s card ${card} invites you to notice where you run on autopilot and where you can slow down.\n\n` +
        `It sounds strongest at work and in conversations: notice moments when you answer out of habit rather than choice.\n\n` +
        `Today’s step: before evening, take one small action in that direction — then note what shifted in how the day felt.`,
    };
  }

  const cards = input.positions
    .map((p) => `${p.label}: ${p.card} (${p.direction})`)
    .join(', ');

  if (isYesNo) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] По вопросу «${input.question || '—'}» карта ${card} скорее поддерживает движение вперёд, чем торможение. ` +
          `В раскладе (${cards || 'нет'}) видно, где уже достаточно ясности для шага.\n\n` +
          `Ответ: Скорее да.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] On “${input.question || '—'}”, card ${card} leans toward moving forward rather than holding back. ` +
        `In the spread (${cards || 'none'}) there is already enough clarity for a step.\n\n` +
        `Answer: Likely yes.`,
    };
  }

  if (input.mode === 'deep') {
    const ru = langIsRu(input.language);
    const perCard = input.positions
      .map((p) =>
        ru
          ? `Позиция «${p.label || '—'}» — ${p.card} (${p.direction}): здесь карта показывает, что именно в этой точке ситуации просит вашего внимания. Она не приговор, а подсветка того, что уже заметно.`
          : `Position “${p.label || '—'}” — ${p.card} (${p.direction}): here the card shows what in this part of the situation asks for your attention. It is not a verdict, just a highlight of what is already visible.`
      )
      .join('\n\n');
    return {
      interpretation: ru
        ? `[DEV MOCK · ГЛУБОКИЙ РАЗБОР] По вопросу «${input.question || '—'}» расклад отвечает: движение возможно, если перестать ждать идеального момента.\n\n` +
          `${perCard}\n\n` +
          `Связи. Первая и последняя карты спорят друг с другом: одна тянет вперёд, другая просит сперва признать усталость. Вторая связка усиливает тему выбора.\n\n` +
          `Рисунок расклада. Баланс смещён к внутренним процессам: обстоятельства здесь вторичны, главное — ваше решение.\n\n` +
          `Память. Похожая тема уже звучала в ваших прошлых раскладах — сейчас она возвращается с новой стороны.\n\n` +
          `Вопросы к себе. Что я уже знаю, но откладываю? Чего я жду от других, что могу дать себе сам? Какой маленький шаг я готов сделать сегодня?\n\n` +
          `Шаг на сегодня: запишите одним предложением, чего вы на самом деле хотите, и сделайте одно действие в эту сторону.`
        : `[DEV MOCK · DEEP READING] On “${input.question || '—'}” the spread answers: movement is possible once you stop waiting for the perfect moment.\n\n` +
          `${perCard}\n\n` +
          `Connections. The first and last cards argue: one pulls forward, the other asks you to admit fatigue first. The second pair reinforces the theme of choice.\n\n` +
          `Pattern. The balance leans to inner processes: circumstances are secondary, your decision is the main thing.\n\n` +
          `Memory. A similar theme has come up in your past readings — now it returns from a new angle.\n\n` +
          `Questions for yourself. What do I already know but keep postponing? What do I expect from others that I can give myself? What small step am I ready to take today?\n\n` +
          `Today’s step: write in one sentence what you actually want, and take one action toward it.`,
    };
  }

  if (key.includes('dayparts')) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] Утро: заметьте, где вы уже спешите, и дайте себе один спокойный жест перед делами.\n\n` +
          `День: держите внимание на одном выборе, а не на всём списке сразу (${cards || 'нет'}).\n\n` +
          `Вечер: отметьте, что удалось отпустить — без оценки «получился ли день».`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] Morning: notice where you are already rushing, and give yourself one calm gesture before the tasks.\n\n` +
        `Day: keep attention on one choice, not the whole list (${cards || 'none'}).\n\n` +
        `Evening: note what you managed to release — without grading whether the day “worked”.`,
    };
  }

  if (key.includes('boundaries')) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] По вопросу «${input.question || '—'}» расклад про границы: где вы уже сдаёте себя и чего хотите на самом деле. ` +
          `Карты (${cards || 'нет'}) не зовут «просто уйти» — они показывают цену молчания и одно ясное слово на сегодня.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] On “${input.question || '—'}”, this is a boundaries reading: where you already give yourself away and what you actually want. ` +
        `Cards (${cards || 'none'}) are not a “just leave” default — they show the cost of silence and one clear wording for today.`,
    };
  }

  if (key.includes('betweenus')) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] По вопросу «${input.question || '—'}» видно динамику между вами сейчас, не прогноз союза. ` +
          `Карты (${cards || 'нет'}) разделяют ваш вклад и вклад другого; вердикта «любит / не любит» нет.\n\n` +
          `Честный шаг сегодня — назвать вслух одну вещь, которую вы до сих пор держали внутри.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] On “${input.question || '—'}”, the spread shows the dynamic between you now, not a forecast of the union. ` +
        `Cards (${cards || 'none'}) split what you bring and what the other brings; there is no “they love you / they don’t” verdict.\n\n` +
        `The honest step today is to name out loud one thing you have been holding in.`,
    };
  }

  if (key.includes('stayorgo')) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] По вопросу «${input.question || '—'}» сравниваются два названных пути: цена остаться и цена уйти. ` +
          `Карты (${cards || 'нет'}) показывают, кем вы становитесь на каждом, без «судьбы».\n\n` +
          `Сегодня ближе тот путь, где вы меньше прячетесь от собственной ясности.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] On “${input.question || '—'}”, two named paths are compared: the cost of staying and the cost of leaving. ` +
        `Cards (${cards || 'none'}) show who you become on each — not destiny.\n\n` +
        `Today the more aligned path is the one where you hide less from your own clarity.`,
    };
  }

  if (key.includes('inmyhands')) {
    if (langIsRu(input.language)) {
      return {
        interpretation:
          `[DEV MOCK] По вопросу «${input.question || '—'}» расклад делит: что в ваших руках и что нет. ` +
          `Карты (${cards || 'нет'}) просят не тратить силу на чужое.\n\n` +
          `Граница на сегодня — один отказ от того, что вам не принадлежит.`,
      };
    }
    return {
      interpretation:
        `[DEV MOCK] On “${input.question || '—'}”, the spread splits what is in your hands and what is not. ` +
        `Cards (${cards || 'none'}) ask you not to spend force on what isn’t yours.\n\n` +
        `Today’s boundary is one refusal of what does not belong to you.`,
    };
  }

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
