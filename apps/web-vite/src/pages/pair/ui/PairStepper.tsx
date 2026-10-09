import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { PairRelation } from '@features/pairReading';
import { Text } from '@shared/ui';
import styles from '../Pair.module.css';

export type PairStep = 0 | 1 | 2;

/**
 * Степпер «Твои карты → Карты партнёра (друга, близкого) → Общее чтение» (у партнёра средний шаг —
 * «Показать или нет»). Сегменты как в прогрессе DS: активный accent400,
 * пройденный calm500, будущий ground600; под ними подпись текущего шага.
 */
export function PairStepper({
  step,
  role,
  relation,
}: {
  step: PairStep;
  role: 'author' | 'partner';
  /** Подпись «Карты партнёра / друга / близкого» у автора. */
  relation?: PairRelation;
}): ReactElement {
  const { t } = useTranslation();
  const label = t(`together:pair.stepper.${role}.${step}`, { context: relation });
  return (
    <div className={styles.stepper} role="img" aria-label={t('together:pair.stepper.a11y', { n: step + 1, label })}>
      <div className={styles.stepperBar}>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={
              index < step
                ? `${styles.segment} ${styles.segmentDone}`
                : index === step
                  ? `${styles.segment} ${styles.segmentActive}`
                  : styles.segment
            }
          />
        ))}
      </div>
      <Text role="micro" tone="ink100">
        {t('together:pair.stepper.step', { n: step + 1 })} · {label}
      </Text>
    </div>
  );
}
