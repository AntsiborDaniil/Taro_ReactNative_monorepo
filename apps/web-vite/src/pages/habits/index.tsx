import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header, Text } from '@shared/ui';
import { HabitType } from '@entities/habits';
import styles from './Habits.module.css';

/**
 * Перенос apps/web/src/pages/habitChoose — выбор вектора: вырастить полезную
 * привычку (build) или отпустить вредную (quit). Навигация → /habits/new?type=.
 */
export default function HabitsPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title="" />
        <Text role="label" tone="accent" className={styles.eyebrow}>
          {t('habits:choose.eyebrow')}
        </Text>
        <Text role="title" as="h1" className={styles.title}>
          {t('habits:choose.title')}
        </Text>
        <Text role="body" tone="ink100" className={styles.subtitle}>
          {t('habits:choose.subtitle')}
        </Text>

        <button
          type="button"
          className={styles.card}
          onClick={() => navigate(`/habits/new?type=${HabitType.BuildPositive}`)}
        >
          <span className={styles.cardCaption}>{t('habits:choose.badge.build')}</span>
          <span className={styles.cardTitle}>{t('habits:button.chooseBad')}</span>
          <span className={styles.cardDescription}>{t('habits:choose.card.buildDescription')}</span>
        </button>

        <button
          type="button"
          className={styles.card}
          onClick={() => navigate(`/habits/new?type=${HabitType.QuitNegative}`)}
        >
          <span className={styles.cardCaption}>{t('habits:choose.badge.quit')}</span>
          <span className={styles.cardTitle}>{t('habits:button.chooseGood')}</span>
          <span className={styles.cardDescription}>{t('habits:choose.card.quitDescription')}</span>
        </button>
      </div>
    </div>
  );
}
