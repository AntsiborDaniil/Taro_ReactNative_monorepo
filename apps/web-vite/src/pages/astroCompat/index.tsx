import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  SIGNS,
  SIGN_GLYPH,
  elementOf,
  modalityOf,
  useAstroProfile,
  type Element,
  type Modality,
  type ZodiacSign,
} from '@shared/lib/astro';
import { getImage } from '@shared/lib/getImage';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { ChargeMark, Chip, Header, SmartImage, Text } from '@shared/ui';
import styles from './AstroCompat.module.css';

const NS = 'astroChart';
const ELEMENT_ORDER: Element[] = ['fire', 'earth', 'air', 'water'];
const MODALITY_ORDER: Modality[] = ['cardinal', 'fixed', 'mutable'];

/** Ключ пары в каноническом порядке (огонь-вода, а не вода-огонь). */
function pairKey<T extends string>(a: T, b: T, order: readonly T[]): string {
  return order.indexOf(a) <= order.indexOf(b) ? `${a}-${b}` : `${b}-${a}`;
}

/** Совместимость знаков по стихиям и модальностям. Данные партнёра живут только в состоянии экрана. */
export default function Page(): ReactElement {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const profile = useAstroProfile();
  const [you, setYou] = useState<ZodiacSign | null>(null);
  const [partner, setPartner] = useState<ZodiacSign | null>(null);
  const mine = you ?? profile?.sign ?? null;

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.astroCompatView);
  }, []);

  const goTogether = () => {
    reachMetrikaGoal(MetrikaGoal.astroToTarot, { from: 'compat' });
    navigate('/spreads/together_couple');
  };

  const renderPicker = (value: ZodiacSign | null, onPick: (s: ZodiacSign) => void, label: string) => (
    <div className={styles.pick} role="group" aria-label={label}>
      <Text role="label" tone="ink100">
        {label}
      </Text>
      <div className={styles.chips}>
        {SIGNS.map((s) => (
          <Chip key={s} selected={value === s} onClick={() => onPick(s)}>
            <span className={styles.glyph}>{SIGN_GLYPH[s]}&#xFE0E;</span> {t(`sign.${s}`)}
          </Chip>
        ))}
      </div>
    </div>
  );

  let result: ReactElement | null = null;
  if (mine && partner) {
    const ea = elementOf(mine);
    const eb = elementOf(partner);
    const pk = pairKey(ea, eb, ELEMENT_ORDER);
    const mk = pairKey(modalityOf(mine), modalityOf(partner), MODALITY_ORDER);
    result = (
      <section className={styles.result} aria-live="polite">
        <Text role="title" as="h2">
          {t('compat.combo', { a: t(`sign.${mine}`), b: t(`sign.${partner}`) })}
        </Text>
        <Text role="label" tone="accent">
          {SIGN_GLYPH[mine]}&#xFE0E; {t(`element.${ea}`)} · {SIGN_GLYPH[partner]}&#xFE0E; {t(`element.${eb}`)}
        </Text>
        <div className={styles.block}>
          <Text role="label" tone="accent">
            {t('compat.gives')}
          </Text>
          <Text role="body">{t(`pair.${pk}.gives`)}</Text>
        </div>
        <div className={styles.block}>
          <Text role="label" tone="accent">
            {t('compat.learn')}
          </Text>
          <Text role="body">{t(`pair.${pk}.learn`)}</Text>
        </div>
        <div className={styles.block}>
          <Text role="label" tone="accent">
            {t('compat.rhythm')}
          </Text>
          <Text role="body">{t(`modalityPair.${mk}`)}</Text>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className={styles.root}>
        <div className={styles.inner}>
          <Header title={t('compat.title')} showBack />
          <Text role="body" tone="ink100">
            {t('compat.lead')}
          </Text>
          <div className={styles.layout}>
            <div className={styles.pickers}>
              {renderPicker(mine, setYou, t('compat.pickYou'))}
              {renderPicker(partner, setPartner, t('compat.pickPartner'))}
            </div>
            <div className={styles.right}>
              {result ?? (
                <div className={styles.hint}>
                  <Text role="body" tone="ink100">
                    {t('compat.pickHint')}
                  </Text>
                </div>
              )}

              <button type="button" className={styles.bridge} onClick={goTogether}>
                <SmartImage
                  className={styles.bridgeImg}
                  src={getImage(['spreads', 'flatIllustration', 'together_couple'])}
                />
                <span className={styles.bridgeShade} />
                <span className={styles.bridgeBody}>
                  <span className={styles.bridgeText}>
                    <Text role="lead" as="span">
                      {t('bridge.title')}
                    </Text>
                    <Text role="micro" as="span" tone="ink100">
                      {t('bridge.subtitle')}
                    </Text>
                  </span>
                  <ChargeMark cost={2} size="md" overlay />
                </span>
              </button>
              <Text role="micro" tone="ink100">
                {t('bridge.hint')} {t('compat.disclaimer')}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
