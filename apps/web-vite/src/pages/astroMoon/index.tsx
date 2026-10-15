import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { skyToday } from '@shared/lib/astro/engine';
import { skyAtMoscowNoon } from '@shared/lib/astro/moonDay';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, ChevronLeftIcon, ChevronRightIcon, Header, ListRow, MoonPhaseIcon, StarField, Text } from '@shared/ui';
import styles from './AstroMoon.module.css';

const NEW_MOON_TARGET = '/spreads/selfDevelopment_inMyHands';
const FULL_MOON_TARGET = '/mirror';

/** Лунный календарь месяца: фаза каждого дня на 12:00 МСК, детали по тапу, ритуалы новолуния и полнолуния. */
export default function AstroMoonPage(): ReactElement {
  const { t, i18n } = useTranslation('astro');
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [selected, setSelected] = useState(now.getDate());

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.astroMoonView);
  }, []);

  const nearest = useMemo(() => skyToday(now), [now]);
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  // Сдвиг первой клетки: неделя с понедельника.
  const offset = (new Date(view.y, view.m - 1, 1).getDay() + 6) % 7;

  const cells = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => skyAtMoscowNoon(view.y, view.m, i + 1)),
    [view, daysInMonth],
  );

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    // 5 января 2026 — понедельник.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 0, 5 + i)));
  }, [i18n.language]);

  const monthRaw = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    new Date(view.y, view.m - 1, 1),
  );
  const monthTitle = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' });
  const shortFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });

  const isToday = (day: number) => view.y === now.getFullYear() && view.m === now.getMonth() + 1 && day === now.getDate();
  const day = Math.min(selected, daysInMonth);
  const daySky = cells[day - 1];

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m - 1 + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
    const sameMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    setSelected(sameMonth ? now.getDate() : 1);
  };

  return (
    <div className={styles.root}>
      <StarField />
      <div className={styles.column}>
        <Header title={t('moon.headerTitle')} />
        <div className={styles.monthBar}>
          <button type="button" className={styles.arrow} onClick={() => shift(-1)} aria-label={t('moon.prev')}>
            <ChevronLeftIcon width={22} height={22} />
          </button>
          <Text role="title" as="h2" className={styles.monthTitle}>
            {monthTitle}
          </Text>
          <button type="button" className={styles.arrow} onClick={() => shift(1)} aria-label={t('moon.next')}>
            <ChevronRightIcon width={22} height={22} />
          </button>
        </div>
        <div className={styles.grid} role="grid" aria-label={monthTitle}>
          {weekdays.map((w) => (
            <span key={w} className={styles.weekday} role="columnheader">
              {w}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`b${i}`} aria-hidden="true" />
          ))}
          {cells.map((cell, i) => {
            const d = i + 1;
            const classes = [styles.cell, isToday(d) ? styles.today : null, d === day ? styles.selected : null]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={d}
                type="button"
                role="gridcell"
                className={classes}
                aria-pressed={d === day}
                aria-label={`${dateFmt.format(new Date(view.y, view.m - 1, d))}, ${t(`phase.${cell.phase}`)}`}
                onClick={() => setSelected(d)}
              >
                <span className={styles.num}>{d}</span>
                <MoonPhaseIcon illumination={cell.illumination} waxing={cell.waxing} size={26} />
              </button>
            );
          })}
        </div>

        <section className={styles.details} aria-live="polite">
          <div className={styles.detailsHead}>
            <MoonPhaseIcon illumination={daySky.illumination} waxing={daySky.waxing} size={44} />
            <div>
              <Text role="label" as="h3" className={styles.phaseName}>
                {t(`phase.${daySky.phase}`)}
              </Text>
              <Text role="micro" tone="ink100">
                {t('moon.dayLine', {
                  date: dateFmt.format(new Date(view.y, view.m - 1, day)),
                  in: t(`signIn.${daySky.moonSign}`),
                })}
                {' · '}
                {t('moon.illumination', { value: daySky.illumination })}
              </Text>
            </div>
          </div>
          <Text role="body" tone="ink100">
            {t(`ritual.${daySky.phase}`)}
          </Text>
          {daySky.phase === 'new' ? (
            <Button onClick={() => navigate(NEW_MOON_TARGET)}>{t('moon.cta.new')}</Button>
          ) : null}
          {daySky.phase === 'full' ? (
            <Button onClick={() => navigate(FULL_MOON_TARGET)}>{t('moon.cta.full')}</Button>
          ) : null}
        </section>

        <div className={styles.rows}>
          {nearest.nextNew ? (
            <ListRow
              leadingIcon={<MoonPhaseIcon illumination={0} waxing size={24} />}
              title={t('moon.nextNew', { date: shortFmt.format(nearest.nextNew) })}
              subtitle={t('moon.nextNewHint')}
              to={NEW_MOON_TARGET}
            />
          ) : null}
          {nearest.nextFull ? (
            <ListRow
              leadingIcon={<MoonPhaseIcon illumination={100} waxing size={24} />}
              title={t('moon.nextFull', { date: shortFmt.format(nearest.nextFull) })}
              subtitle={t('moon.nextFullHint')}
              to={FULL_MOON_TARGET}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
