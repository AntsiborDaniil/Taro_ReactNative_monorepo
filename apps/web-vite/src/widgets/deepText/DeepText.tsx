import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import { parseDeepText, splitQuestions } from '../lib/parseDeepText';
import styles from './DeepText.module.css';

/**
 * Текст толкования с разметкой по лид-словам: обычные абзацы — как раньше,
 * «Связи / Рисунок / Память» — подблоки с заголовком, «Вопросы к себе» —
 * нумерованный список, «Шаг на сегодня» — тот же блок с линией сверху, текст крупнее.
 * Работает и для обычных раскладов: там есть «Шаг на сегодня».
 */
export function DeepText({ paragraphs }: { paragraphs: string[] }): ReactElement {
  const { t } = useTranslation();
  const parts = parseDeepText(paragraphs);

  return (
    <div className={styles.root}>
      {parts.map((part, index) => {
        const delay = { animationDelay: `${Math.min(index, 6) * 60}ms` };
        if (part.kind === 'text') {
          return (
            <Text key={index} role="body" tone="ink50" className={styles.paragraph} style={delay}>
              {part.text}
            </Text>
          );
        }
        if (part.kind === 'step') {
          // Как остальные блоки разбора: линия сверху + подпись, но текст чуть крупнее — это итог.
          return (
            <div key={index} className={styles.block} style={delay}>
              <Text role="label" tone="accent" as="h3" className={styles.blockTitle}>
                {t('spread:deep.block.step')}
              </Text>
              <Text role="lead" tone="ink50" className={styles.blockText}>
                {part.text}
              </Text>
            </div>
          );
        }
        if (part.kind === 'questions') {
          return (
            <div key={index} className={styles.block} style={delay}>
              <Text role="label" tone="accent" as="h3" className={styles.blockTitle}>
                {t('spread:deep.block.questions')}
              </Text>
              <ol className={styles.questions}>
                {splitQuestions(part.text).map((question, qi) => (
                  <li key={qi} className={styles.question}>
                    <span className={styles.questionIndex} aria-hidden="true">
                      {qi + 1}
                    </span>
                    <Text role="body" tone="ink50" as="span">
                      {question}
                    </Text>
                  </li>
                ))}
              </ol>
            </div>
          );
        }
        return (
          <div key={index} className={styles.block} style={delay}>
            <Text role="label" tone="accent" as="h3" className={styles.blockTitle}>
              {t(`spread:deep.block.${part.kind}`)}
            </Text>
            <Text role="body" tone="ink50" className={styles.blockText}>
              {part.text}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
