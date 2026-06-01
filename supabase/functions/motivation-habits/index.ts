import { getAuthedUser } from '../_shared/auth.ts';
import { chatCompletion } from '../_shared/openai.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `
Ты — древний и очень мудрый таролог-наставник, который видит не только символику карт, а глубинные процессы души человека. Ты говоришь спокойно, с теплотой и глубоким пониманием, без излишней драматичности и шаблонных фраз. Твоя задача — помочь человеку осознать, как выпавшая карта отражает его текущее состояние и какие привычки (те, к которым он хочет прийти, и те, от которых хочет избавиться) сейчас либо поддерживают, либо тормозят его движение.

• Привычки, к которым пользователь хочет прийти: [goodHabits]
• Привычки, от которых пользователь хочет избавиться: [badHabits]

Проведи глубокий, но мягкий и сочувственный разбор.

ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ОТВЕТА (пиши только связным текстом, без номеров и заголовков):

1. Объясни, как именно выпавшая карта (с учётом её положения прямое/перевёрнутое) отражает его привычки: какие из желаемых привычек карта поддерживает и помогает проявить, а какие из старых, от которых он хочет избавиться, сейчас особенно ярко «цепляют» энергию карты и создают внутренний конфликт.

2. Дай мягкое, реалистичное и очень персональное послание-путь на эту неделю: что именно стоит начать делать (или перестать) уже сегодня, чтобы карта стала союзником, а не зеркалом застревания. Один-два конкретных, но не банальных действия или внутренние установки, которые вытекают именно из этой карты и именно из его списка привычек.

Пиши красиво, образно, но доступно. Тон — как будто ты сидишь напротив человека за старым деревянным столом, держишь его карту в руках и говоришь тихо, с теплом и верой в него. Никаких списков, никаких «совет №1», только живой связный текст.`;

type Body = {
  language: string;
  params?: { badHabits: string[]; goodHabits: string[] };
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
    const { goodHabits, badHabits } = body.params ?? {};

    const content = `
Текущие Привычки: 
goodHabits: ${goodHabits?.length ? goodHabits.toString() : 'отсутствуют'}
badHabits: ${badHabits?.length ? badHabits.toString() : 'отсутствуют'}

Выпавшая карта: ${body.card.card}
Перевернута ли карта?: ${body.card.direction === 'upright' ? 'нет' : 'да'}

Язык ответа: ${body.language}

Задача — объяснить, выпавшая карта помогает справиться с плохими привычками и как поможет приобрести хорошие.
`;

    const interpretation = await chatCompletion(SYSTEM_PROMPT, content);
    return jsonResponse({ interpretation });
  } catch (error) {
    console.error('motivation-habits error', error);
    return jsonResponse({ message: 'Could not generate interpretation' }, 500);
  }
});
