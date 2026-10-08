import { useEffect, useState, type ReactElement } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardDirection, tarotCards } from '@legacy-data';
import { getTarotCardReadings, isCardOpenedFromSpread, TarotCardFace } from '@entities/spread';
import { FavoriteButton } from '@entities/favorites';
import { ensureI18nNamespaces } from '@shared/i18n';
import { Button, Chip, EmptyState, Header, Text } from '@shared/ui';
import { CardStudy } from './ui/CardStudy';
import styles from './CardDetail.module.css';

/**
 * Перенос логики apps/web/src/pages/detailCard (DetailCard.tsx) без RN/UI
 * Kitten-разметки: переключатель прямое/перевёрнутое положение, значение
 * карты. card.json — тяжёлый namespace, грузим лениво через
 * ensureI18nNamespaces(['card']) перед первым рендером перевода (ключи
 * `<cardId>.meaning.<upright|reversed>.<spreadName>.<positionIndex>`,
 * `<cardId>.description.<direction>.<index>` и т.п. — см.
 * cardsData.ts/TTarotCardTexts, сами данные не читаем целиком).
 */
export default function CardDetailPage(): ReactElement {
  const { cardId } = useParams<{ cardId: string }>();
  const { t } = useTranslation();
  const study = !isCardOpenedFromSpread(useLocation().state);
  const [cardNsReady, setCardNsReady] = useState(false);
  const [direction, setDirection] = useState<TarotCardDirection>(TarotCardDirection.Upright);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const card = cardId ? tarotCards[cardId] : null;

  if (!card) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" />
          <EmptyState title={t('core:stub.missingData.title')} />
        </div>
      </div>
    );
  }

  const reading = getTarotCardReadings({ card, keys: ['keywords', 'description'], direction });

  const characteristics = [
    // characteristics.json хранит arcana (major/minor) под ключом "suit.*" вместе с мастями — не отдельный namespace "arcana".
    card.arcana ? t(`characteristics:suit.${card.arcana}`) : null,
    card.suit ? t(`characteristics:suit.${card.suit}`) : null,
    card.element ? t(`characteristics:element.${card.element}`) : null,
    card.astrology?.planet ? t(`characteristics:planet.${card.astrology.planet}`) : null,
    card.astrology?.zodiac ? t(`characteristics:zodiac.${card.astrology.zodiac}`) : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t(card.name)} showBack right={<FavoriteButton cardId={card.id} cardName={t(card.name)} />} />

        <div className={styles.imageWrap}>
          <TarotCardFace cardId={card.id} direction={direction} className={styles.image} />
        </div>

        <div className={styles.directionRow}>
          <Chip selected={direction === TarotCardDirection.Upright} onClick={() => setDirection(TarotCardDirection.Upright)}>
            {t('core:card.upright')}
          </Chip>
          <Chip selected={direction === TarotCardDirection.Reversed} onClick={() => setDirection(TarotCardDirection.Reversed)}>
            {t('core:card.reversed')}
          </Chip>
        </div>

        {characteristics.length > 0 ? (
          <div className={styles.characteristics}>
            {characteristics.map((label) => (
              <span key={label} className={styles.tag}>
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {cardNsReady && reading.description ? (
          <section className={styles.panel}>
            <Text role="label" tone="ink100" as="h2">
              {t('core:cardStudy.meaning')}
            </Text>
            <Text role="body" tone="ink100" className={descriptionOpen ? undefined : styles.clamped}>
              {t(reading.description)}
            </Text>
            <Button
              variant="link"
              className={styles.more}
              onClick={() => setDescriptionOpen((open) => !open)}
              aria-expanded={descriptionOpen}
            >
              {descriptionOpen ? t('core:cardStudy.collapse') : t('core:cardStudy.readMore')}
            </Button>
          </section>
        ) : null}

        {cardNsReady && study ? <CardStudy cardId={card.id} direction={direction} /> : null}
      </div>
    </div>
  );
}
