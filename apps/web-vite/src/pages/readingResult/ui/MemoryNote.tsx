import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { TSpreadMemoryNote } from '@legacy-data';
import { TarotCardFace } from '@entities/spread';
import { Text } from '@shared/ui';
import styles from './MemoryNote.module.css';

function formatDate(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(date);
}

/**
 * Плашка «памяти» сразу после общего разбора: факт из истории раскладов
 * (карта выпадала раньше / доминирующая масть месяца). Строка детерминированная,
 * собрана на сервере без LLM; здесь только форматирование через i18n.
 */
export function MemoryNote({ note }: { note: TSpreadMemoryNote }): ReactElement | null {
  const { t, i18n } = useTranslation();

  let text: string;
  if (note.kind === 'card') {
    const card = t(`card:${note.cardId}.name`);
    const date = formatDate(note.date, i18n.language);
    // spreadName — i18n-ключ названия расклада (spread:...) либо готовая строка.
    const spreadName = note.spreadName ? t(note.spreadName) : '';
    text = spreadName
      ? t('spread:memoryNote.card', { card, date, spread: spreadName })
      : t('spread:memoryNote.cardNoSpread', { card, date });
  } else {
    const suitKey = `spread:memoryNote.suits.${note.suit}`;
    if (!i18n.exists(suitKey)) return null;
    text = t('spread:memoryNote.suit', { suit: t(suitKey), pct: note.pct });
  }

  return (
    <div className={styles.note}>
      {note.kind === 'card' ? (
        <span className={styles.thumb}>
          <TarotCardFace cardId={note.cardId} />
        </span>
      ) : null}
      <Text role="body" tone="ink100" className={styles.text}>
        {text}
      </Text>
    </div>
  );
}
