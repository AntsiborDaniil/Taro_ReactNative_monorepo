import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CITIES,
  SIGNS,
  SIGN_GLYPH,
  clearAstroProfile,
  findCity,
  profileFromBirth,
  saveAstroProfile,
  useAstroProfile,
  type ZodiacSign,
} from '@shared/lib/astro';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { Button, Chip, Header, Input, ListRow, StarField, Switch, Text, useToast } from '@shared/ui';
import styles from './AstroProfile.module.css';

const MIN_DATE = '1900-01-01';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= MIN_DATE && value <= todayISO();
}

/** Безопасный путь возврата: только внутренние /astro-адреса. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/astro') ? raw : '/astro';
}

/**
 * Астро-профиль (локально, без сервера): шаг 1 — знак или дата, шаг 2 — время и город.
 * Все данные пишутся только в localStorage через shared/lib/astro/profile.
 */
export default function AstroProfilePage(): ReactElement {
  const { t, i18n } = useTranslation('astro');
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const profile = useAstroProfile();

  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [pickedSign, setPickedSign] = useState<ZodiacSign | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [cityId, setCityId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const dateValid = isValidDate(date);
  const dateTouched = date.length > 0 && !dateValid;
  const derived = dateValid ? profileFromBirth(date, null, null).sign : null;
  const activeSign = derived ?? pickedSign;
  const lang = i18n.language.startsWith('en') ? 'en' : 'ru';

  const showForm = !profile || editing;

  const startEdit = () => {
    setPickedSign(profile?.birthDate ? null : (profile?.sign ?? null));
    setDate(profile?.birthDate ?? '');
    setTime(profile?.birthTime ?? '');
    setTimeUnknown(Boolean(profile?.birthDate && !profile.birthTime));
    setCityId(profile?.cityId ?? null);
    setStep(1);
    setEditing(true);
  };

  const cityResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter((c) => c.ru.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const finish = (withTimeCity: boolean) => {
    if (dateValid) {
      const useTime = withTimeCity && !timeUnknown && /^\d{2}:\d{2}$/.test(time) && cityId ? time : null;
      const useCity = withTimeCity && cityId ? cityId : null;
      saveAstroProfile(profileFromBirth(date, useTime, useCity));
      reachMetrikaGoal(MetrikaGoal.astroProfileSaved, { level: useTime && useCity ? 'full' : 'date' });
    } else if (pickedSign) {
      saveAstroProfile({ sign: pickedSign, birthDate: null, birthTime: null, cityId: null });
      reachMetrikaGoal(MetrikaGoal.astroProfileSaved, { level: 'sign' });
    } else {
      return;
    }
    setEditing(false);
    navigate(next, { replace: true });
  };

  const handleDelete = () => {
    clearAstroProfile();
    setEditing(false);
    toast.success(t('profile.deleted'));
  };

  const privacy = (
    <p className={styles.privacy}>
      {t('privacy')}
    </p>
  );

  if (!showForm && profile) {
    const city = findCity(profile.cityId);
    const none = t('profile.current.none');
    return (
      <div className={styles.root}>
        <StarField />
        <div className={styles.column}>
          <Header title={t('profile.title')} />
          <Text role="title" as="h2" className={styles.h}>
            {t('profile.current.title')}
          </Text>
          <div className={styles.list}>
            <ListRow
              leadingIcon={<span className={styles.glyph}>{`${SIGN_GLYPH[profile.sign]}\uFE0E`}</span>}
              title={t(`sign.${profile.sign}`)}
              subtitle={t('profile.current.sign')}
            />
            <ListRow title={profile.birthDate ?? none} subtitle={t('profile.current.date')} />
            <ListRow title={profile.birthTime ?? none} subtitle={t('profile.current.time')} />
            <ListRow title={city ? city[lang] : none} subtitle={t('profile.current.city')} />
          </div>
          {privacy}
          <Button onClick={startEdit}>{t('profile.edit')}</Button>
          <Button variant="quiet" onClick={handleDelete}>
            {t('profile.delete')}
          </Button>
        </div>
      </div>
    );
  }

  const selectedCity = findCity(cityId);

  return (
    <div className={styles.root}>
      <StarField />
      <div className={styles.column}>
        <Header
          title={t('profile.title')}
          onBack={step === 2 ? () => setStep(1) : profile ? () => setEditing(false) : undefined}
        />
        {dateValid ? (
          <Text role="micro" tone="ink100" className={styles.stepLabel}>
            {t('profile.step', { n: step })}
          </Text>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <Text role="title" as="h2" className={styles.h}>
                {t('profile.step1.title')}
              </Text>
              <Text role="body" tone="ink100">
                {t('profile.step1.text')}
              </Text>
            </div>
            <Input
              type="date"
              label={t('profile.date')}
              value={date}
              min={MIN_DATE}
              max={todayISO()}
              error={dateTouched ? t('profile.date.error') : undefined}
              onChange={(e) => {
                setDate(e.target.value);
                if (e.target.value) setPickedSign(null);
              }}
            />
            <Text role="label" tone="ink100">
              {t('profile.orPick')}
            </Text>
            <div className={styles.signGrid} role="group" aria-label={t('profile.orPick')}>
              {SIGNS.map((sign) => (
                <button
                  key={sign}
                  type="button"
                  className={activeSign === sign ? `${styles.signTile} ${styles.signActive}` : styles.signTile}
                  aria-pressed={activeSign === sign}
                  onClick={() => {
                    setPickedSign(sign);
                    setDate('');
                  }}
                >
                  <span className={styles.signGlyph} aria-hidden="true">
                    {`${SIGN_GLYPH[sign]}\uFE0E`}
                  </span>
                  <span className={styles.signName}>{t(`sign.${sign}`)}</span>
                  <span className={styles.signDates}>{t(`signDates.${sign}`)}</span>
                </button>
              ))}
            </div>
            {privacy}
            {dateValid ? (
              <Button onClick={() => setStep(2)}>{t('profile.next')}</Button>
            ) : (
              <Button disabled={!pickedSign} onClick={() => finish(false)}>
                {t('profile.save')}
              </Button>
            )}
          </>
        ) : (
          <>
            <div>
              <Text role="title" as="h2" className={styles.h}>
                {t('profile.step2.title')}
              </Text>
              <Text role="body" tone="ink100">
                {t('profile.step2.text')}
              </Text>
            </div>
            <Input
              type="time"
              label={t('profile.time')}
              value={timeUnknown ? '' : time}
              disabled={timeUnknown}
              onChange={(e) => setTime(e.target.value)}
            />
            <Switch
              label={t('profile.timeUnknown')}
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
            />
            {timeUnknown ? (
              <p className={styles.note} role="note">
                {t('profile.timeUnknown.note')}
              </p>
            ) : null}
            {selectedCity ? (
              <ListRow
                title={selectedCity[lang]}
                subtitle={t('profile.city')}
                trailing={
                  <Chip onClick={() => { setCityId(null); setQuery(''); }}>{t('profile.city.clear')}</Chip>
                }
              />
            ) : (
              <>
                <Input
                  type="search"
                  label={t('profile.city')}
                  placeholder={t('profile.city.search')}
                  value={query}
                  autoComplete="off"
                  onChange={(e) => setQuery(e.target.value)}
                />
                {cityResults.length > 0 ? (
                  <div className={styles.list}>
                    {cityResults.map((c) => (
                      <ListRow
                        key={c.id}
                        title={c[lang]}
                        onClick={() => {
                          setCityId(c.id);
                          setQuery('');
                        }}
                      />
                    ))}
                  </div>
                ) : query.trim() ? (
                  <Text role="micro" tone="ink100">
                    {t('profile.city.none')}
                  </Text>
                ) : null}
              </>
            )}
            {privacy}
            <Button onClick={() => finish(true)}>{t('profile.save')}</Button>
            <Button variant="quiet" onClick={() => finish(false)}>
              {t('profile.skip')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
