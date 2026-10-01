import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AffirmationCategory,
  readRememberedCategory,
  useAffirmations,
} from '@entities/affirmations';
import { ensureI18nNamespaces } from '@shared/i18n';
import { Chip, Header, Skeleton, Text, useToast } from '@shared/ui';
import styles from './Affirmations.module.css';

const CATEGORIES: { category: AffirmationCategory; labelKey: string; locked: boolean }[] = [
  { category: AffirmationCategory.General, labelKey: 'affirmations:general', locked: false },
  { category: AffirmationCategory.Career, labelKey: 'affirmations:career', locked: true },
  { category: AffirmationCategory.Love, labelKey: 'affirmations:love', locked: true },
  { category: AffirmationCategory.Purpose, labelKey: 'affirmations:purpose', locked: true },
  { category: AffirmationCategory.Health, labelKey: 'affirmations:health', locked: true },
  { category: AffirmationCategory.Motivation, labelKey: 'affirmations:motivation', locked: true },
];

/**
 * Перенос apps/web/src/pages/affirmations (Affirmations.tsx + SelectCategory +
 * MeditativeVisualizer) — чипы категорий вместо выезжающей шторки (DS-чипы
 * в ряд), карточка с текущей аффирмацией (подсвеченные слова — accent400).
 * affirmations.json — тяжёлый lazy namespace, грузим через ensureI18nNamespaces.
 */
export default function AffirmationsPage(): ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [nsReady, setNsReady] = useState(false);
  const { selectedCategory, selectedAffirmation, canAccessCategory, selectCategory } = useAffirmations();
  const initialized = useRef(false);

  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('affirmations').then(() => {
      if (alive) setNsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!nsReady || initialized.current) return;
    initialized.current = true;
    const remembered = readRememberedCategory();
    const initial = remembered && canAccessCategory(remembered) ? remembered : AffirmationCategory.General;
    selectCategory(initial, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsReady]);

  const handleSelect = (item: (typeof CATEGORIES)[number]) => {
    if (!canAccessCategory(item.category)) {
      toast.info(t('affirmations:signInRequired.body'));
      return;
    }
    selectCategory(item.category, t);
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('affirmations:affirmations')} />

        <div className={styles.statusCard}>
          <span className={styles.statusDot} />
          <Text role="label" as="h2" className={styles.statusTitle}>
            {t('affirmations:hasAffirmation')}
          </Text>
          <Text role="body" tone="ink100" className={styles.statusSubtitle}>
            {t('affirmations:categoryHint')}
          </Text>
        </div>

        {!nsReady ? (
          <Skeleton width="100%" height={220} radius={24} />
        ) : (
          <div className={styles.visual}>
            {selectedAffirmation ? (
              <p className={styles.affirmationText}>
                {selectedAffirmation.texts.text.map((part, index) => (
                  <span key={index} className={part.colored ? styles.wordColored : undefined}>
                    {part.content}{' '}
                  </span>
                ))}
              </p>
            ) : (
              <Text role="body" tone="ink100">
                {t('affirmations:tomorrowAffirmation')}
              </Text>
            )}
          </div>
        )}

        <div className={styles.chips}>
          {CATEGORIES.map((item) => (
            <Chip
              key={item.category}
              selected={selectedCategory === item.category}
              onClick={() => handleSelect(item)}
            >
              {item.locked && !canAccessCategory(item.category) ? `🔒 ${t(item.labelKey)}` : t(item.labelKey)}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
