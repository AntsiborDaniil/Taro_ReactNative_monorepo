import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeFollowUps, TarotCardFace, useGetSharedSpreadQuery } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';
import { downloadStoryForSpread } from '@features/shareReading';
import { DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { decodeSharedReadingParam } from '@shared/lib/sharedReadingLink';
import { useAppSelector } from '@shared/lib/store';
import { Button, Header, PageSkeleton, Text, useToast } from '@shared/ui';
import styles from './SharedReading.module.css';

/** Абзацы ответа AI: пустая строка — граница абзаца. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Read-only страница расшаренного расклада `/r/:id` — открывается в обычном
 * браузере без входа (публичный GET /api/spreads/shared/:id). Нет поля
 * уточнения, избранного и навигации по функциям; внизу — CTA «Сделать свой расклад».
 */
export default function SharedReadingPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const readingId = useMemo(() => decodeSharedReadingParam(id), [id]);
  const { data: spread, isLoading, isError } = useGetSharedSpreadQuery(readingId ?? '', { skip: !readingId });
  const [cardNsReady, setCardNsReady] = useState(false);
  // ?story=1 — сюда Mini App уводит во внешний браузер за картинкой для сторис
  // (WebView Telegram blob не скачивает).
  const [searchParams] = useSearchParams();
  const storyMode = searchParams.get('story') === '1';
  const deckStyle = useAppSelector((state) => state.settings.settings.appearance?.deckStyle) ?? DECK_STYLE_FLAT;
  const toast = useToast();
  const [storyBusy, setStoryBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setCardNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const cta = (
    <div className={styles.cta}>
      <Text role="lead" tone="ink50" as="p" className={styles.ctaLead}>
        {t('spread:shared.ctaLead')}
      </Text>
      <Button variant="action" fullWidth onClick={() => navigate('/')}>
        {t('spread:shared.ctaButton')}
      </Button>
    </div>
  );

  if (isLoading) return <PageSkeleton />;

  if (!readingId || isError || !spread || !spread.interpretation?.trim()) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" showBack={false} showCredits={false} />
          <div className={styles.empty}>
            <Text role="title" tone="ink50" as="h2">
              {t('spread:shared.notFoundTitle')}
            </Text>
            <Text role="body" tone="ink100">
              {t('spread:shared.notFoundText')}
            </Text>
          </div>
          {cta}
        </div>
      </div>
    );
  }

  const handleDownloadStory = async () => {
    if (storyBusy || !readingId) return;
    setStoryBusy(true);
    try {
      await downloadStoryForSpread({
        spread,
        t,
        deckStyle,
        question: spread.question,
      });
      toast.success(t('spread:share.storySaved'));
    } catch {
      toast.error(t('spread:share.storyFailed'));
    } finally {
      setStoryBusy(false);
    }
  };

  const cards = spread.selectedCards ?? [];
  const paragraphs = toParagraphs(spread.interpretation);
  const followUps = normalizeFollowUps(spread.followUps);
  const positionLabel = (index: number) => {
    const meaning = spread.cardsOrder?.[index]?.meaning;
    return meaning ? t(`spread:${meaning}`) : '';
  };
  // Тексты карты — ключи card.json; у части (keywords) нет префикса namespace.
  const cardText = (key?: string): string => {
    if (!key) return '';
    const full = key.includes(':') ? key : `card:${key}`;
    return i18n.exists(full) ? t(full) : '';
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t(spread.name)} showBack={false} showCredits={false} />

        <Text role="label" tone="accent" className={styles.sharedLabel}>
          {t('spread:shared.label')}
        </Text>

        {storyMode ? (
          <Button variant="action" fullWidth loading={storyBusy} onClick={handleDownloadStory}>
            {t('spread:share.storyDownload')}
          </Button>
        ) : null}

        {spread.question ? (
          <div className={styles.question}>
            <Text role="label" tone="accent">
              {t('spread:flow.questionSection')}
            </Text>
            <Text role="lead" tone="ink50">
              «{spread.question}»
            </Text>
          </div>
        ) : null}

        <div className={styles.cards}>
          {cards.map((card, index) => (
            <div key={`${card.id}-${index}`} className={styles.cardItem}>
              <span className={styles.cardFace}>
                <TarotCardFace cardId={card.id} direction={card.direction} />
              </span>
              <Text role="micro" tone="ink100" className={styles.cardCaption}>
                {positionLabel(index) || t(card.name)}
              </Text>
            </div>
          ))}
        </div>

        <section className={styles.summary}>
          <Text role="title" tone="accent" as="h2">
            {t('spread:summaryTitle')}
          </Text>
          {spread.mode === 'deep' ? (
            <Text role="label" tone="accent">
              {t('spread:deep.subtitle')}
            </Text>
          ) : null}
          <div className={styles.paragraphs}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} role="body" tone="ink50" className={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </div>
        </section>

        {followUps.length > 0 ? (
          <section className={styles.block}>
            <Text role="title" tone="ink50" as="h2">
              {t('spread:shared.followUps')}
            </Text>
            {followUps.map((item, index) => (
              <div key={index} className={styles.followUpItem}>
                <Text role="micro" tone="ink100">
                  {t('spread:followUp.authorAsked')}
                </Text>
                <Text role="body" tone="ink50" className={styles.followUpQuestion}>
                  {item.q}
                </Text>
                <Text role="body" tone="ink50" className={styles.paragraph}>
                  {item.a}
                </Text>
              </div>
            ))}
          </section>
        ) : null}

        <section className={styles.block}>
          <Text role="title" tone="ink50" as="h2">
            {t('spread:cardsMeaningTitle')}
          </Text>
          {cards.map((card, index) => {
            const reversed = card.direction === TarotCardDirection.Reversed;
            const keywords = cardNsReady ? cardText(card.keywords) : '';
            const meaning = cardNsReady ? cardText(card.meaning) : '';
            const advice = cardNsReady ? cardText(card.advice) : '';
            return (
              <article key={`${card.id}-${index}`} className={styles.detail}>
                {positionLabel(index) ? (
                  <Text role="label" tone="accent">
                    {positionLabel(index)}
                  </Text>
                ) : null}
                <Text role="title" tone="ink50" as="h3">
                  {t(card.name)}
                </Text>
                <div className={styles.chips}>
                  <span className={reversed ? styles.chipReversed : styles.chip}>
                    {reversed ? t('spread:reverseCard') : t('spread:uprightCard')}
                  </span>
                </div>
                {keywords ? (
                  <Text role="micro" tone="ink100">
                    {keywords}
                  </Text>
                ) : null}
                {meaning ? (
                  <Text role="body" tone="ink50">
                    {meaning}
                  </Text>
                ) : null}
                {advice ? (
                  <div className={styles.advice}>
                    <Text role="label" tone="accent">
                      {t('spread:adviceTitle')}
                    </Text>
                    <Text role="body" tone="ink50">
                      {advice}
                    </Text>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        {cta}
      </div>
    </div>
  );
}
