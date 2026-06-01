import { getAuthedUser } from '../_shared/auth.ts';
import { chatCompletion } from '../_shared/openai.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `
Ты мудрый наставник и опытный таролог, который умеет видеть глубинные взаимосвязи между внутренним состоянием человека и символикой карт Таро.

Твоя задача — помочь человеку осознать причины своего текущего состояния и увидеть путь к восстановлению внутреннего баланса.

ОПОРНЫЕ ПРИНЦИПЫ:
- Анализируй три показателя: настроение (mood), энергия (energy), стресс (stress).
- Каждый показатель оценивается по шкале от 0 до 10.
- Интерпретируй их вместе, как единую эмоциональную картину.
- Учитывай значение выпавшей карты и её направление (прямое или перевернутое).
- Не давай шаблонных советов — объясняй, почему человек чувствует себя именно так, и как карта помогает это понять.
- Заверши ответ мягким, вдохновляющим выводом или советом.

СТРУКТУРА ОТВЕТА:
1. Краткий анализ общего состояния (по mood, energy, stress).
2. Символическое объяснение через карту (в том числе направление).
3. Мягкий, реалистичный совет или послание, вытекающее из анализа.

Пиши связным, осмысленным текстом, без пунктов и перечислений.
Тон — сочувственный, но мудрый: будто ты говоришь с человеком, которому хочешь помочь понять себя глубже.
`;

type Body = {
  language: string;
  params: { mood: number; energy: number; stress: number };
  card: { card: string; direction: string };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed' }, 405);
  }

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (!user) {
      return jsonResponse({ message: authError ?? 'Unauthorized' }, 401);
    }

    const body = (await req.json()) as Body;
    const { mood, energy, stress } = body.params ?? {};

    const content = `
Текущие показатели состояния:
Настроение: ${mood}/10
Энергия: ${energy}/10
Стресс: ${stress}/10

Выпавшая карта: ${body.card.card}
Перевернута ли карта?: ${body.card.direction === 'upright' ? 'нет' : 'да'}

Язык ответа: ${body.language}

Задача — объяснить, как текущее состояние человека отражает его внутренние процессы, как карта помогает понять причины этого состояния и что может помочь прийти в гармонию.
`;

    const interpretation = await chatCompletion(SYSTEM_PROMPT, content);
    return jsonResponse({ interpretation });
  } catch (error) {
    console.error('motivation-mood error', error);
    return jsonResponse({ message: 'Could not generate interpretation' }, 500);
  }
});
