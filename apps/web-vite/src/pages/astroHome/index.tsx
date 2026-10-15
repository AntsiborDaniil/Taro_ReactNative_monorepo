import { useEffect, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAY_ADVICE_SPREAD } from '@entities/spread';
import { useOpenFreePeriodCard } from '@features/freePeriodCard';
import { SectionSwitch } from '@features/sectionSwitch';
import { useAstroProfile, findCity } from '@shared/lib/astro';
import { natalChart, skyToday } from '@shared/lib/astro/engine';
import { skyAtMoscowNoon } from '@shared/lib/astro/moonDay';
import { markAstroVisited } from '@shared/lib/astroAnnounce';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, Header, ListRow, MoonPhaseIcon, StarField, Text, Tile } from '@shared/ui';
import { SkyHero } from './ui/SkyHero';
import styles from './AstroHome.module.css';

const WEEK_DAYS = 7;

/** Мини-расчёт «Твоё небо»: Луна и асцендент считаются на устройстве только при наличии данных. */
function usePersonalSky(profile: ReturnType<typeof useAstroProfile>) {
  return useMemo(() => {
    if (!profile) return null;
    if (!profile.birthDate) return { moon: null, asc: null, timeKnown: false };
    const city = findCity(profile.cityId);
    const chart = natalChart({
      date: profile.birthDate,
      time: profile.birthTime,
      lat: city?.lat ?? null,
      lon: city?.lon ?? null,
      tz: city?.tz ?? null,
    });
    const moon = chart.planets.find((p) => p.planet === 'moon')?.sign ?? null;
    return { moon, asc: chart.asc?.sign ?? null, timeKnown: chart.timeKnown };
  }, [profile]);
}

/** Главная раздела «Астрология»: небо сегодня, «твоё небо», переходы, Луна на неделе, мост в таро. */
export default function AstroHomePage(): ReactElement {
  const { t, i18n } = useTranslation('astro');
  const navigate = useNavigate();
  const profile = useAstroProfile();
  const { open: openFreeCard } = useOpenFreePeriodCard();
  const sky = useMemo(() => skyToday(new Date()), []);
  const personal = usePersonalSky(profile);

  useEffect(() => {
    markAstroVisited();
  }, []);

  const week = useMemo(() => {
    const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    return Array.from({ length: WEEK_DAYS }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const daySky = skyAtMoscowNoon(date.getFullYear(), date.getMonth() + 1, date.getDate());
      return { key: i, label: weekday.format(date), day: date.getDate(), sky: daySky };
    });
  }, [i18n.language]);

  const handleBridge = () => {
    track(AnalyticAction.ClickDayCard);
    reachMetrikaGoal(MetrikaGoal.astroToTarot, { from: 'home' });
    openFreeCard(DAY_ADVICE_SPREAD);
  };

  const dash = '—';

  return (
    <div className={styles.root}>
      <StarField />
      <div className={styles.inner}>
        <Header root title={t('core:nav.tab.main')} />
        <SectionSwitch current="astro" />
        <div className={styles.layout}>
          <div className={styles.hero}>
            <SkyHero sky={sky} hasProfile={Boolean(profile)} />
          </div>
          <div className={styles.side}>
            <section className={styles.mine} aria-labelledby="astro-mine">
              {profile && personal ? (
                <>
                  <Text role="label" as="h2" id="astro-mine" className={styles.sectionTitle}>
                    {t('home.mine.title', { sign: t(`sign.${profile.sign}`) })}
                  </Text>
                  <div className={styles.tiles}>
                    <SkyTile glyph="☉" label={t('home.mine.sun')} value={t(`sign.${profile.sign}`)} />
                    <SkyTile
                      glyph="☽"
                      label={t('home.mine.moon')}
                      value={personal.moon ? t(`sign.${personal.moon}`) : dash}
                      hint={personal.moon ? (personal.timeKnown ? undefined : t('home.mine.approx')) : t('home.mine.needDate')}
                    />
                    <SkyTile
                      glyph="↑"
                      label={t('home.mine.asc')}
                      value={personal.asc ? t(`sign.${personal.asc}`) : dash}
                      hint={personal.asc ? undefined : profile.birthDate ? t('home.mine.needTime') : t('home.mine.needDate')}
                    />
                  </div>
                </>
              ) : (
                <Tile className={styles.empty}>
                  <Text role="label" as="h2" id="astro-mine">
                    {t('home.mine.emptyTitle')}
                  </Text>
                  <Text role="body" tone="ink100">
                    {t('home.mine.emptyText')}
                  </Text>
                  <Button variant="quiet" quietTone="accent" onClick={() => navigate('/astro/profile')}>
                    {t('home.mine.emptyCta')}
                  </Button>
                </Tile>
              )}
            </section>
            <div className={styles.rows}>
              <ListRow
                leadingIcon={<span className={styles.rowGlyph} aria-hidden="true">✶</span>}
                title={t('home.rows.natal')}
                subtitle={t('home.rows.natalHint')}
                to="/astro/natal"
              />
              <ListRow
                leadingIcon={<span className={styles.rowGlyph} aria-hidden="true">♡</span>}
                title={t('home.rows.compat')}
                subtitle={t('home.rows.compatHint')}
                to="/astro/compat"
              />
              <ListRow
                leadingIcon={<MoonPhaseIcon illumination={sky.illumination} waxing={sky.waxing} size={24} />}
                title={t('home.rows.moon')}
                subtitle={t('home.rows.moonHint')}
                to="/astro/moon"
              />
            </div>
          </div>
          <section className={styles.week} aria-labelledby="astro-week">
            <Text role="label" as="h2" id="astro-week" className={styles.sectionTitle}>
              {t('home.week.title')}
            </Text>
            <ol className={styles.weekList}>
              {week.map((d) => (
                <li key={d.key} className={d.key === 0 ? `${styles.weekDay} ${styles.today}` : styles.weekDay}>
                  <span className={styles.weekLabel}>{d.label}</span>
                  <MoonPhaseIcon
                    illumination={d.sky.illumination}
                    waxing={d.sky.waxing}
                    size={28}
                    title={t(`phase.${d.sky.phase}`)}
                  />
                  <span className={styles.weekNum}>{d.day}</span>
                </li>
              ))}
            </ol>
          </section>
          <Tile className={styles.bridge}>
            <Text role="label" as="h2">
              {t('home.bridge.title')}
            </Text>
            <Text role="body" tone="ink100">
              {t('home.bridge.text')}
            </Text>
            <Button variant="quiet" quietTone="accent" onClick={handleBridge}>
              {t('home.bridge.cta')}
            </Button>
          </Tile>
        </div>
      </div>
    </div>
  );
}

function SkyTile({ glyph, label, value, hint }: { glyph: string; label: string; value: string; hint?: string }): ReactElement {
  return (
    <Tile className={styles.skyTile}>
      <span className={styles.skyGlyph} aria-hidden="true">
        {glyph}
      </span>
      <span className={styles.skyLabel}>{label}</span>
      <span className={styles.skyValue}>{value}</span>
      {hint ? <span className={styles.skyHint}>{hint}</span> : null}
    </Tile>
  );
}
