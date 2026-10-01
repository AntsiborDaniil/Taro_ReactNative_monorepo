import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addSelectedCard } from '@entities/spread';
import type { TSelectedTarotCard } from '@legacy-data';
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

  useEffect(() => {
    if (!selectedSpread) {
      navigate('/spreads', { replace: true });
    } else if (hasInterpretation) {
      navigate('/reading/result', { replace: true });
    }
  }, [selectedSpread, hasInterpretation, navigate]);

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
  const isComplete = selectedSpread.cardsCount > 0 && selectedCards.length >= selectedSpread.cardsCount;

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
