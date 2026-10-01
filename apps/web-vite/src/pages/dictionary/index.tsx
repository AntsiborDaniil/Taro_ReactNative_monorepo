import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ARCANAS_AND_SUITS_NAMES,
  tarotCards,
  TarotCardArcana,
  TarotCardSuit,
  type TTarotCard,
} from '@legacy-data';
import { TarotCardFace } from '@entities/spread';
import { ensureI18nNamespaces } from '@shared/i18n';
import { ArcanaMajorIcon, CupsIcon, Header, PentaclesIcon, Skeleton, SwordsIcon, Text, WandsIcon } from '@shared/ui';
import { SuitItem } from './ui/SuitItem';
import styles from './Dictionary.module.css';

const SUITS = [
  { id: 'major', value: TarotCardArcana.Major as TarotCardArcana | TarotCardSuit, Icon: ArcanaMajorIcon },
  { id: 'cups', value: TarotCardSuit.Cups as TarotCardArcana | TarotCardSuit, Icon: CupsIcon },
  { id: 'wands', value: TarotCardSuit.Wands as TarotCardArcana | TarotCardSuit, Icon: WandsIcon },
  { id: 'swords', value: TarotCardSuit.Swords as TarotCardArcana | TarotCardSuit, Icon: SwordsIcon },
  { id: 'pentacles', value: TarotCardSuit.Pentacles as TarotCardArcana | TarotCardSuit, Icon: PentaclesIcon },
];

/**
 * Перенос apps/web/src/pages/cardsDictionary — чипы мастей (SuitItem) +
 * сетка карт выбранной масти/аркана, клик → /card/:id. Данные колоды —
 * @legacy-data (tarotCards), не копируются.
 */
export default function DictionaryPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TarotCardArcana | TarotCardSuit>(TarotCardArcana.Major);
  const [cardNsReady, setCardNsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const cards = useMemo<TTarotCard[]>(
    () => Object.values(tarotCards).filter((card) => (card.suit ?? card.arcana) === selected),
    [selected],
  );

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('core:page.dictionary')} />
        <div className={styles.suits}>
          {SUITS.map((suit) => (
            <SuitItem
              key={suit.id}
              Icon={suit.Icon}
              selected={selected === suit.value}
              onClick={() => setSelected(suit.value)}
              label={t(ARCANAS_AND_SUITS_NAMES[suit.value])}
            />
          ))}
        </div>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          {t(ARCANAS_AND_SUITS_NAMES[selected])}
        </Text>
        {!cardNsReady ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} width="100%" height="auto" radius={12} style={{ aspectRatio: '9 / 16' }} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={styles.tile}
                onClick={() => navigate(`/card/${card.id}`)}
              >
                <TarotCardFace cardId={card.id} />
                <Text role="micro" className={styles.name}>
                  {t(card.name)}
                </Text>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
