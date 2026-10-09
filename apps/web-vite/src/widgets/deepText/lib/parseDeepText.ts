/** Разметка толкования по лид-словам — чистые функции для ui/DeepText. */

export type DeepBlockKind =
  | 'connections'
  | 'pattern'
  | 'memory'
  | 'questions'
  | 'step'
  // «Расклад на двоих» (pairSystemPrompt): общий рисунок → связь → разговор.
  | 'overall'
  | 'connection'
  | 'conversation';

/** Лид-слова, которыми модель начинает абзацы (ru/en, см. deepSystemPrompt и SPREAD_RULES в API). */
const LEADS: Array<{ kind: DeepBlockKind; re: RegExp }> = [
  { kind: 'connections', re: /^(Связи|Connections)\s*[.:]\s*/i },
  { kind: 'pattern', re: /^(Рисунок расклада|Pattern)\s*[.:]\s*/i },
  { kind: 'memory', re: /^(Память|Memory)\s*[.:]\s*/i },
  { kind: 'questions', re: /^(Вопросы к себе|Questions for yourself)\s*[.:]\s*/i },
  { kind: 'step', re: /^(Шаг на сегодня|Today[’']s step)\s*[.:]\s*/i },
  { kind: 'overall', re: /^(Общий рисунок|Overall pattern)\s*[.:]\s*/i },
  { kind: 'connection', re: /^(Связь|Connection)\s*[.:]\s*/i },
  { kind: 'conversation', re: /^(Разговор, который стоит начать|A conversation worth starting)\s*[.:]\s*/i },
];

export type DeepPart = { kind: 'text'; text: string } | { kind: DeepBlockKind; text: string };

export function parseDeepText(paragraphs: string[]): DeepPart[] {
  return paragraphs.map((paragraph) => {
    for (const lead of LEADS) {
      if (lead.re.test(paragraph)) {
        // После лид-слова модель часто пишет со строчной («Шаг на сегодня: до вечера…»).
        const rest = paragraph.replace(lead.re, '');
        return { kind: lead.kind, text: rest.charAt(0).toUpperCase() + rest.slice(1) };
      }
    }
    return { kind: 'text', text: paragraph };
  });
}

/** «Вопросы к себе»: один абзац → отдельные вопросы по «?». */
export function splitQuestions(text: string): string[] {
  const parts = text.match(/[^?]+\?/g)?.map((q) => q.trim()).filter(Boolean) ?? [];
  return parts.length >= 2 ? parts : [text];
}
