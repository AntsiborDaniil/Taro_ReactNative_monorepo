import OpenAI from 'openai';
import {
  TarotInterpretationOutput,
  TarotSpreadInput,
} from '../types';
import * as dotenv from 'dotenv';
import { useMockOpenAi } from '../lib/devMode';
import { mockGenerateInterpretation } from '../dev/mockOpenAi';
import { toOpenAiProviderError } from '../lib/openaiErrors';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
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

export async function generateInterpretation({
  spread_type,
  positions,
  language,
  question,
}: TarotSpreadInput): Promise<TarotInterpretationOutput> {
  if (useMockOpenAi()) {
    return mockGenerateInterpretation({
      spread_type,
      positions,
      language,
      question,
    });
  }

  const content = `
ВОПРОС КЛИЕНТА: "${question}"

Тип расклада: ${spread_type}

Выпавшие карты в позициях:
${positions.map((p) => `${p.label}: ${p.card} Перевернута ли карта?:(${p.direction === 'upright' ? 'нет' : 'да'})`).join('\n')}

Язык ответа: ${language}

Помни: твоя задача — ответить на вопрос через призму всего расклада, а не описывать карты по отдельности. Карты должны рассказать единую историю в контексте заданного вопроса.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      temperature: 0.8,
    });

    return {
      interpretation: completion.choices[0]?.message?.content ?? '',
    };
  } catch (error) {
    throw toOpenAiProviderError(error) ?? error;
  }
}
