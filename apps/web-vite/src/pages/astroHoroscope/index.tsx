import { useEffect, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { DAY_ADVICE_SPREAD } from '@entities/spread';
import { useGetDailyHoroscopeQuery, type HoroscopeFacet } from '@entities/astro';
import { useOpenFreePeriodCard } from '@features/freePeriodCard';
import { SIGN_GLYPH, useAstroProfile } from '@shared/lib/astro';
import { skyToday } from '@shared/lib/astro/engine';
import { getCurrentDate } from '@shared/lib/date';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, EmptyState, Header, Skeleton, StarField, Text } from '@shared/ui';
import styles from './AstroHoroscope.module.css';

const FACET_LEVEL: Record<HoroscopeFacet, number> = { warm: 3, even: 2, gentle: 1 };
const FACETS = ['love', 'work', 'energy'] as const;

function FacetScale({ level }: { level: number }): ReactElement {
  return (
    <span className={styles.scale} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= level ? `${styles.seg} ${styles.segOn}` : styles.seg} />
      ))}
    </span>
  );
}

/** Гороскоп дня по знаку: текст с сервера (без личных данных), грани словами, вопрос дня и мост в таро. */
export default function AstroHoroscopePage(): ReactElement {
  const { t, i18n } = useTranslation('astro');
  const profile = useAstroProfile();
  const lang = i18n.language.startsWith('en') ? 'en' : 'ru';
  const { open: openFreeCard } = useOpenFreePeriodCard();
  const sky = useMemo(() => skyToday(new Date()), []);
  const { data, isLoading, isFetching, isError, refetch } = useGetDailyHoroscopeQuery(
    { sign: profile?.sign ?? 'aries', lang },
    { skip: !profile },
  );

  const shown = Boolean(data);
  useEffect(() => {
    if (shown) reachMetrikaGoal(MetrikaGoal.astroHoroscopeView, { sign: profile?.sign });
  }, [shown, profile?.sign]);

  if (!profile) return <Navigate to="/astro/profile?next=/astro/horoscope" replace />;

  const handleCard = () => {
    reachMetrikaGoal(MetrikaGoal.astroToTarot, { from: 'horoscope' });
    openFreeCard(DAY_ADVICE_SPREAD);
  };

  const paragraphs = data ? data.text.split(/\n\s*\n/).filter(Boolean) : [];
  const dateLabel = getCurrentDate('badge');

  return (
    <div className={styles.root}>
      <StarField />
      <div className={styles.column}>
        <Header title={t('horoscope.title')} />
        <div className={styles.head}>
          <span className={styles.glyph} aria-hidden="true">
            {`${SIGN_GLYPH[profile.sign]}\uFE0E`}
          </span>
          <div className={styles.headText}>
            <Text role="title" as="h2" className={styles.signName}>
              {t(`sign.${profile.sign}`)}
            </Text>
            <Text role="micro" tone="ink100">
              {dateLabel} · {t('horoscope.moon', { in: t(`signIn.${sky.moonSign}`), phase: t(`phase.${sky.phase}`) })}
            </Text>
          </div>
        </div>

        {isError ? (
          <EmptyState
            title={t('horoscope.error.title')}
            description={t('horoscope.error.text')}
            action={
              <Button loading={isFetching} onClick={() => void refetch()}>
                {t('horoscope.retry')}
              </Button>
            }
          />
        ) : isLoading || !data ? (
          <div className={styles.skeleton} aria-busy="true">
            <Skeleton height={18} />
            <Skeleton height={18} width="92%" />
            <Skeleton height={18} width="85%" />
            <Skeleton height={18} width="60%" />
            <Skeleton height={96} radius={18} />
          </div>
        ) : (
          <>
            <div className={styles.text}>
              {paragraphs.map((p, i) => (
                <Text key={i} role="body">
                  {p}
                </Text>
              ))}
            </div>
            <section aria-label={t('horoscope.facets')} className={styles.facets}>
              {FACETS.map((key) => (
                <div key={key} className={styles.facet}>
                  <span className={styles.facetLabel}>{t(`horoscope.${key}`)}</span>
                  <span className={styles.facetWord}>{t(`facet.${data.facets[key]}`)}</span>
                  <FacetScale level={FACET_LEVEL[data.facets[key]]} />
                </div>
              ))}
            </section>
            <blockquote className={styles.question}>
              <span className={styles.questionLabel}>{t('horoscope.question')}</span>
              <span className={styles.questionText}>{data.question}</span>
            </blockquote>
          </>
        )}

        <Button onClick={handleCard}>{t('horoscope.cta')}</Button>
        <Link to="/astro/profile?next=/astro/horoscope" className={styles.change}>
          {t('horoscope.changeSign')}
        </Link>
      </div>
    </div>
  );
}
