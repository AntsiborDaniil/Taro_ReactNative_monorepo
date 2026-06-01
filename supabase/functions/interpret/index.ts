import { consumeTarotDailySlot, getAuthedUser } from '../_shared/auth.ts';
import { chatCompletion } from '../_shared/openai.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `
Ты опытный таролог с многолетним опытом. Твоя задача — дать цельную консультацию, основанную на заданном вопросе.

ВАЖНЫЕ ПРИНЦИПЫ:
- Начинай с анализа самого вопроса и его контекста
- Учитывай выпала ли перевернутая карта
- Карты рассматривай как единую картину, а не отдельные элементы
- Создавай связное повествование, которое отвечает именно на поставленный вопрос
- Избегай механического перечисления значений карт
- Фокусируйся на том, что карты говорят в контексте конкретного вопроса

СТРУКТУРА ОТВЕТА:
Общая энергетика и послание расклада
Связное толкование как единая история
Конкретный совет, вытекающий из всего расклада

Пиши единым текстом, без пунктов.

Говори как мудрый наставник, который видит глубокие связи и помогает найти ответы.
`;

type TarotPosition = {
  label: string;
  card: string;
  direction: string;
  description?: string;
};

type Body = {
  spread_type: string;
  language: string;
  question: string;
  positions: TarotPosition[];
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
    if (!body?.spread_type || !body?.question || !Array.isArray(body.positions)) {
      return jsonResponse({ message: 'Invalid request body' }, 400);
    }

    const slot = await consumeTarotDailySlot(user.id);
    if (!slot.ok) {
      return jsonResponse(
        {
          message: 'Daily tarot spread limit reached',
          tarotDaily: {
            used: slot.used,
            limit: slot.limit,
            day: slot.day,
          },
        },
        429
      );
    }

    const content = `
ВОПРОС КЛИЕНТА: "${body.question}"

Тип расклада: ${body.spread_type}

Выпавшие карты в позициях:
${body.positions
  .map(
    (p) =>
      `${p.label}: ${p.card} Перевернута ли карта?:(${
        p.direction === 'upright' ? 'нет' : 'да'
      })`
  )
  .join('\n')}

Язык ответа: ${body.language}

Помни: твоя задача — ответить на вопрос через призму всего расклада, а не описывать карты по отдельности. Карты должны рассказать единую историю в контексте заданного вопроса.
`;

    const interpretation = await chatCompletion(SYSTEM_PROMPT, content);

    return jsonResponse({ interpretation });
  } catch (error) {
    console.error('interpret error', error);
    return jsonResponse({ message: 'Could not generate interpretation' }, 500);
  }
});
