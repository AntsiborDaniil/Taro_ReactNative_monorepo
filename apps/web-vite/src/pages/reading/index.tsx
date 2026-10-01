import { useEffect, useRef, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addSelectedCard, addSelectedCards } from '@entities/spread';
import type { TSelectedTarotCard } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, Header, Text } from '@shared/ui';
import { CardChoice } from './ui/CardChoice';
import styles from './Reading.module.css';

/**
 * Выбор карт расклада. Колода (CardChoice) остаётся на экране и после того, как
 * выбраны все карты; под ней появляется «Читать объяснение», которое ведёт на
 * отдельную страницу толкования /reading/result (там запрос к AI, карты и текст).
 * Расклад с готовым толкованием (история, ссылка) сразу открывается на /reading/result.
 */
export default function ReadingPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedSpread = useAppSelector((state) => state.spread.selectedSpread);

  const hasInterpretation = Boolean(selectedSpread?.interpretation?.trim());
  const drawnCount = selectedSpread?.selectedCards?.length ?? 0;
  // Готовое толкование показываем на /reading/result, только если карты есть:
  // иначе та страница вернёт нас обратно и роуты зациклятся.
  const hasAllCards = drawnCount > 0 && drawnCount >= (selectedSpread?.cardsCount ?? 0);

  useEffect(() => {
    if (!selectedSpread) {
      navigate('/spreads', { replace: true });
    } else if (hasInterpretation && hasAllCards) {
      navigate('/reading/result', { replace: true });
    }
  }, [selectedSpread, hasInterpretation, hasAllCards, navigate]);

  // Пока идёт выбор карт, заранее тянем чанк страницы толкования и тяжёлый
  // namespace card: после «Читать объяснение» сразу идёт ожидание AI, без
  // скелета страницы и паузы на загрузке card.json.
  const prefetched = useRef(false);
  useEffect(() => {
    if (drawnCount === 0 || prefetched.current) return;
    prefetched.current = true;
    void import('@pages/readingResult');
    void ensureI18nNamespaces('card');
  }, [drawnCount]);

  if (!selectedSpread) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" showBack />
        </div>
      </div>
    );
  }

  const selectedCards = selectedSpread.selectedCards ?? [];
  const isComplete = selectedSpread.cardsCount > 0 && hasAllCards;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t(selectedSpread.name)} showBack />

        {selectedSpread.question ? (
          <div className={styles.question}>
            <Text role="label" tone="accent">
              {t('spread:flow.questionSection')}
            </Text>
            <Text role="lead" tone="ink50">
              {selectedSpread.question}
            </Text>
          </div>
        ) : null}

        <CardChoice
          spread={selectedSpread}
          selectedCards={selectedCards}
          onDraw={(card: TSelectedTarotCard) => dispatch(addSelectedCard(card))}
          onDrawAll={(cards: TSelectedTarotCard[]) => dispatch(addSelectedCards(cards))}
        />

        {isComplete ? (
          <div className={styles.completion}>
            <Button
              variant="action"
              fullWidth
              onClick={() => {
                reachMetrikaGoal(MetrikaGoal.spreadCompleted, { spreadId: selectedSpread.id });
                navigate('/reading/result');
              }}
            >
              {t('core:choice.completed')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
