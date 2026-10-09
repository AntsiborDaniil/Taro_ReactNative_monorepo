import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import type { PairCardDto, PairView } from '@features/pairReading';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, Text } from '@shared/ui';
import { DeepText } from '@widgets/deepText';
import { useCardName } from '@shared/lib/useCardName';
import { PairStepper } from './PairStepper';
import styles from '../Pair.module.css';

/** Абзацы ответа AI: пустая строка — граница абзаца. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function CardCell({ card, name }: { card: PairCardDto; name: string }): ReactElement {
  return (
    <div className={styles.resultCell}>
      <span className={styles.resultFace}>
        <TarotCardFace
          cardId={card.card_id}
          direction={card.direction === 'reversed' ? TarotCardDirection.Reversed : TarotCardDirection.Upright}
        />
      </span>
      <Text role="micro" tone="ink50" className={styles.cardCaption}>
        {name}
      </Text>
    </div>
  );
}

/**
 * Общее чтение пары: заголовок «Ваше общее чтение», колонки «Ты / {Имя}» и построчно
 * позиция → моя карта → карта партнёра; ниже текст через DeepText. Партнёру-новичку
 * внизу мягкий CTA: своя карта дня и свой расклад на двоих.
 */
export function ResultView({ pair }: { pair: PairView }): ReactElement | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameOf = useCardName();

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.pairReadingView, { role: pair.role });
  }, [pair.role]);

  const isAuthor = pair.role === 'author';
  const mine = (isAuthor ? pair.authorCards : pair.partnerCards) ?? [];
  const theirs = (isAuthor ? pair.partnerCards : pair.authorCards) ?? [];
  if (mine.length === 0 || theirs.length === 0 || !pair.pairInterpretation) return null;

  // Автор видит партнёра как «Партнёр» (имя партнёра не хранится), партнёр — автора по имени приглашения.
  const otherName = isAuthor ? '' : pair.inviterName.trim();

  return (
    <>
      <PairStepper step={2} role={isAuthor ? 'author' : 'partner'} relation={pair.relation} />

      <section className={styles.statusBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.result.title')}
        </Text>
        <Text role="body" tone="ink100">
          {otherName ? t('together:pair.result.intro', { name: otherName }) : t('together:pair.result.introAnon', { context: pair.relation })}
        </Text>
      </section>

      <section className={styles.resultBoard}>
        <div className={styles.resultHead}>
          <Text role="label" tone="accent">
            {t('together:pair.result.you')}
          </Text>
          <span />
          <Text role="label" tone="accent">
            {otherName || t('together:pair.result.partner', { context: pair.relation })}
          </Text>
        </div>
        {mine.map((card, index) => {
          const other = theirs[index];
          return (
            <div key={`${card.card_id ?? card.card}-${index}`} className={styles.resultRow}>
              <CardCell card={card} name={nameOf(card)} />
              <Text role="label" tone="ink100" className={styles.resultPosition}>
                {card.label}
              </Text>
              {other ? <CardCell card={other} name={nameOf(other)} /> : <span />}
            </div>
          );
        })}
      </section>

      <section className={styles.summary}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.result.reading')}
        </Text>
        <DeepText paragraphs={toParagraphs(pair.pairInterpretation)} />
      </section>

      {!isAuthor ? (
        <div className={styles.actions}>
          <Text role="body" tone="ink100" className={styles.center}>
            {t('together:pair.result.newbieLead')}
          </Text>
          <Button variant="action" fullWidth onClick={() => navigate('/spreads/simple_daySuggest')}>
            {t('together:pair.result.daily')}
          </Button>
          <Button variant="quiet" quietTone="accent" fullWidth onClick={() => navigate('/spreads/together_pair')}>
            {t('together:pair.result.own')}
          </Button>
        </div>
      ) : null}
    </>
  );
}
