import { describe, expect, it } from 'vitest';
import { parseDeepText, splitQuestions } from './parseDeepText';

describe('parseDeepText', () => {
  it('распознаёт лид-слова ru/en и оставляет обычные абзацы', () => {
    const parts = parseDeepText([
      'Прямой ответ на вопрос.',
      'Связи. Башня спорит со Звездой.',
      'Вопросы к себе. Что я держу? Чего боюсь? Что отпущу?',
      'Шаг на сегодня: напиши одно письмо.',
      "Today's step: take a walk.",
    ]);
    expect(parts.map((p) => p.kind)).toEqual(['text', 'connections', 'questions', 'step', 'step']);
    expect(parts[1].text).toBe('Башня спорит со Звездой.');
    expect(parts[3].text).toBe('Напиши одно письмо.');
  });

  it('делит вопросы по знаку вопроса', () => {
    expect(splitQuestions('Что я держу? Чего боюсь? Что отпущу?')).toEqual(['Что я держу?', 'Чего боюсь?', 'Что отпущу?']);
    expect(splitQuestions('Один вопрос без знака')).toEqual(['Один вопрос без знака']);
  });
});
