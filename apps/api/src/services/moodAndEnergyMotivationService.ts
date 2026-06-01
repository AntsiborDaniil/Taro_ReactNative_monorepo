import OpenAI from 'openai';
import {
  TarotPosition,
  TMoodAndEnergyOutput,
  TMoodAndEnergyInput,
} from '../types';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
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

export async function generateMoodAndEnergyInterpretation({
  params,
  card,
  language,
}: TMoodAndEnergyInput): Promise<TMoodAndEnergyOutput> {
  const { mood, energy, stress } = params;

  const content = `
Текущие показатели состояния:
Настроение: ${mood}/10
Энергия: ${energy}/10
Стресс: ${stress}/10

Выпавшая карта: ${card.card}
Перевернута ли карта?: ${card.direction === 'upright' ? 'нет' : 'да'}

Язык ответа: ${language}

Задача — объяснить, как текущее состояние человека отражает его внутренние процессы, как карта помогает понять причины этого состояния и что может помочь прийти в гармонию.
`;

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
}
