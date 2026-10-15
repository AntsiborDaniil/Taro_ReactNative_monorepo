import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { NatalWheel, PLANET_GLYPH, SIGN_TAROT_CARD_ID } from '@features/natalWheel';
import { CITIES, SIGN_GLYPH, useAstroProfile, type ZodiacSign } from '@shared/lib/astro';
import { natalChart, type NatalChart, type PlanetPosition } from '@shared/lib/astro/engine';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, ChargeMark, EmptyState, Header, ListRow, ModalSheet, Text } from '@shared/ui';
import styles from './AstroNatal.module.css';

const NS = 'astroChart';

function formatDate(iso: string, lang: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB');
}

/** Натальная карта: считается на устройстве, данные рождения никуда не уходят. */
export default function Page(): ReactElement {
  const { t, i18n } = useTranslation([NS, 'astro']);
  const navigate = useNavigate();
  const profile = useAstroProfile();
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<PlanetPosition | null>(null);

  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  const city = useMemo(() => CITIES.find((c) => c.id === profile?.cityId) ?? null, [profile?.cityId]);
  const birthDate = profile?.birthDate ?? null;
  const birthTime = profile?.birthTime ?? null;

  const chart: NatalChart | null = useMemo(() => {
    if (!birthDate) return null;
    try {
      return natalChart({
        date: birthDate,
        time: birthTime,
        lat: city?.lat ?? null,
        lon: city?.lon ?? null,
        tz: city?.tz ?? null,
      });
    } catch {
      return null;
    }
  }, [birthDate, birthTime, city]);

  useEffect(() => {
    if (chart) reachMetrikaGoal(MetrikaGoal.astroNatalView);
  }, [chart != null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile || !birthDate || !chart) {
    return (
      <>
        <div className={styles.inner}>
          <Header title={t(`${NS}:title`)} showBack />
          <EmptyState
            title={t(`${NS}:empty.title`)}
            description={t(`${NS}:empty.description`)}
            icon={<span className={styles.emptyGlyph}>☉︎</span>}
            action={
              <Button onClick={() => navigate('/astro/profile?next=/astro/natal')}>{t(`${NS}:empty.cta`)}</Button>
            }
          />
        </div>
      </>
    );
  }

  const sunPos = chart.planets.find((p) => p.planet === 'sun');
  const moonPos = chart.planets.find((p) => p.planet === 'moon');
  const signName = (s: ZodiacSign) => t(`${NS}:sign.${s}`);
  const centerLines = {
    title: sunPos ? signName(sunPos.sign) : '',
    subtitle: `☽︎ ${moonPos ? signName(moonPos.sign) : ''}${chart.asc ? ` · ↑ ${signName(chart.asc.sign)}` : ''}`,
  };

  const timeMissing = !chart.timeKnown;
  const noTimeText = !birthTime ? t(`${NS}:noTime.text`) : t(`${NS}:noCity.text`);
  const editProfile = () => navigate('/astro/profile?next=/astro/natal');

  return (
    <>
      <div className={styles.root}>
        <div className={styles.inner}>
          <Header title={t(`${NS}:title`)} showBack />
          <div className={styles.layout}>
            <section className={styles.wheelCol}>
              <NatalWheel
                chart={chart}
                selected={selected}
                onSelect={setSelected}
                centerLines={centerLines}
                ariaLabel={t(`${NS}:wheel.a11y`)}
              />
              <div className={styles.meta}>
                <span className={styles.tag}>
                  {formatDate(birthDate, lang)}
                  {chart.timeKnown && birthTime ? ` · ${birthTime}` : ''}
                </span>
                {city ? <span className={styles.tag}>{lang === 'ru' ? city.ru : city.en}</span> : null}
                <button type="button" className={styles.tagBtn} onClick={editProfile} aria-label={t(`${NS}:meta.edit`)}>
                  ✎
                </button>
              </div>
            </section>

            <section className={styles.listCol}>
              {timeMissing ? (
                <div className={styles.notice} role="note">
                  <Text role="body">{noTimeText}</Text>
                  <button type="button" className={styles.noticeAction} onClick={editProfile}>
                    {t(`${NS}:noTime.action`)}
                  </button>
                </div>
              ) : null}

              <Text role="lead" as="h2">
                {t(`${NS}:planets.title`)}
              </Text>
              <div className={styles.list}>
                {chart.planets.map((p) => (
                  <ListRow
                    key={p.planet}
                    selected={selected === p.planet}
                    leadingIcon={<span className={styles.glyph}>{PLANET_GLYPH[p.planet]}</span>}
                    title={
                      <>
                        {t(`${NS}:planet.${p.planet}`)}
                        {p.retro ? (
                          <span className={styles.retro} title={t(`${NS}:retro`)} aria-label={t(`${NS}:retro`)}>
                            {' '}℞
                          </span>
                        ) : null}
                      </>
                    }
                    subtitle={`${SIGN_GLYPH[p.sign]}︎ ${signName(p.sign)} ${p.degree}°`}
                    trailing={
                      <span className={styles.house}>{p.house != null ? t(`${NS}:house`, { n: p.house }) : '—'}</span>
                    }
                    onClick={() => {
                      setSelected(p.planet);
                      setSheet(p);
                    }}
                  />
                ))}
              </div>

              <div className={styles.reading}>
                <Button fullWidth disabled aria-describedby="natal-reading-soon">
                  {t(`${NS}:reading.cta`)} <ChargeMark cost={3} onAction />
                </Button>
                <Text role="micro" tone="ink100" id="natal-reading-soon">
                  {t(`${NS}:reading.soon`)}
                </Text>
              </div>
              <Text role="micro" tone="ink100">
                {t(`${NS}:aspects.hint`)} {t(`${NS}:privacy`)}
              </Text>
            </section>
          </div>
        </div>
      </div>

      <ModalSheet
        open={sheet != null}
        onClose={() => setSheet(null)}
        title={sheet ? `${t(`${NS}:planet.${sheet.planet}`)} · ${signName(sheet.sign)}` : undefined}
        closeLabel={t(`${NS}:sheet.close`)}
      >
        {sheet ? (
          <div className={styles.sheet}>
            <Text role="body">
              {t(`${NS}:sheet.line`, {
                planet: t(`${NS}:planet.${sheet.planet}`),
                signIn: t(`${NS}:signIn.${sheet.sign}`),
                meaning: t(`${NS}:planetMeaning.${sheet.planet}`),
                quality: t(`${NS}:signQuality.${sheet.sign}`),
              })}
            </Text>
            {sheet.house != null ? (
              <Text role="body" tone="ink100">
                {t(`${NS}:sheet.house`, { n: sheet.house, theme: t(`${NS}:houseTheme.${sheet.house}`) })}
              </Text>
            ) : null}
            {sheet.retro ? (
              <Text role="body" tone="ink100">
                {t(`${NS}:sheet.retro`)}
              </Text>
            ) : null}
            <ListRow
              title={t(`${NS}:cardName.${sheet.sign}`)}
              subtitle={t(`${NS}:sheet.card`)}
              leadingIcon={<span className={styles.glyph}>{SIGN_GLYPH[sheet.sign]}&#xFE0E;</span>}
              to={`/card/${SIGN_TAROT_CARD_ID[sheet.sign]}`}
              aria-label={`${t(`${NS}:sheet.openCard`)}: ${t(`${NS}:cardName.${sheet.sign}`)}`}
            />
          </div>
        ) : null}
      </ModalSheet>
    </>
  );
}
