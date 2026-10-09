import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tarotCards } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';

type NamedCard = { card_id?: string; card: string };

/**
 * Имя карты на языке зрителя: по card_id из колоды (а не строкой автора — у получателя
 * может быть другой язык). Пока неймспейс `card` не загружен, показываем сохранённое имя.
 * Для пары и подарка: на сервере хранится имя на языке автора.
 */
export function useCardName(enabled = true): (card: NamedCard) => string {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return useCallback(
    (card: NamedCard) => {
      const known = card.card_id ? tarotCards[card.card_id] : undefined;
      return ready && known ? t(known.name) : card.card;
    },
    [ready, t],
  );
}
