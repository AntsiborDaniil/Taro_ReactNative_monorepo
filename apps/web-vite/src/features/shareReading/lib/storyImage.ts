import type { TFunction } from 'i18next';
import type { TSpread } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';
import { getImage } from '@shared/lib/getImage';
import { getBotHandle } from '@shared/lib/sharedReadingLink';
import { downloadStoryBlob, renderStoryImage } from './renderStoryImage';

/**
 * Собрать и скачать картинку для сторис по раскладу. Общая для листа «Поделиться»
 * (свой расклад) и страницы /r/:id?story=1 (куда Mini App уводит во внешний браузер).
 */
export async function downloadStoryForSpread(params: {
  spread: TSpread;
  t: TFunction;
  deckStyle: string;
  /** Только если автор разрешил показывать вопрос. */
  question?: string | null;
}): Promise<void> {
  const { spread, t, deckStyle, question } = params;
  await ensureI18nNamespaces('card');
  const blob = await renderStoryImage({
    title: t(spread.name),
    summary: spread.interpretation?.trim().split(/\n{2,}/)[0] ?? '',
    question: question?.trim() ? question : undefined,
    botHandle: getBotHandle(),
    backSrc: getImage(['core', 'cardBack']),
    cards: (spread.selectedCards ?? []).map((card, index) => {
      const meaning = spread.cardsOrder?.[index]?.meaning;
      return {
        src: getImage(['tarotCards', deckStyle, `card${card.id}`]),
        reversed: card.direction === 'reversed',
        label: meaning ? t(`spread:${meaning}`) : t(card.name),
      };
    }),
  });
  downloadStoryBlob(blob);
}
