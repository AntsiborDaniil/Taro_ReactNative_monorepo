import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HabitType,
  loadHabits,
  selectAllHabitsCompletedThisWeek,
  selectHabitsLoaded,
  selectHabitsOfTheWeek,
  selectWeekRequiredDays,
  useClaimHabitWeekRewardMutation,
  useGetHabitWeekRewardQuery,
} from '@entities/habits';
import { MotivationKey } from '@entities/tarotMotivation';
import { haptic } from '@shared/lib/haptics';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { Button, ChargeMark, CheckIcon, Header, Text, useToast } from '@shared/ui';
import styles from './Goal.module.css';

/**
 * Награда за закрытую неделю целей: +1 заряд (выдаёт сервер, раз в неделю) и
 * карта недели (AI-итог, бесплатно). Заряд — только если отметки реально были в
 * разные дни: сервер считает дни своих отметок (часы устройства не участвуют),
 * нужно не меньше max(3, дней по расписанию целей).
 */
export default function GoalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const loaded = useAppSelector(selectHabitsLoaded);
  const habitsOfTheWeek = useAppSelector(selectHabitsOfTheWeek);
  const allCompleted = useAppSelector(selectAllHabitsCompletedThisWeek);
  const requiredLocal = useAppSelector(selectWeekRequiredDays);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: status, isLoading: statusLoading } = useGetHabitWeekRewardQuery(undefined, { skip: !isAuthenticated });
  const [claim, { isLoading: claiming }] = useClaimHabitWeekRewardMutation();

  useEffect(() => {
    if (!loaded) dispatch(loadHabits());
  }, [dispatch, loaded]);

  const requiredDays = Math.max(status?.minDays ?? 3, requiredLocal);
  const daysDone = status?.daysWithCheckins ?? 0;
  const enoughDays = daysDone >= requiredDays;
  const claimed = status?.claimed ?? false;

  const openWeekCard = () => {
    const goodHabits = habitsOfTheWeek.filter((h) => h.type === HabitType.BuildPositive).map((h) => h.title);
    const badHabits = habitsOfTheWeek.filter((h) => h.type === HabitType.QuitNegative).map((h) => h.title);
    navigate('/motivation', { state: { key: MotivationKey.Habits, params: { goodHabits, badHabits } } });
  };

  const handleClaim = async () => {
    try {
      await claim({ requiredDays }).unwrap();
      haptic.success();
      toast.success(t('achievements:reward.granted'));
    } catch (error) {
      const code = (error as { data?: { code?: string } })?.data?.code;
      haptic.notify('warning');
      toast.error(
        code === 'already_claimed'
          ? t('achievements:reward.already')
          : code === 'not_enough_days'
            ? t('achievements:reward.notEnough', { done: daysDone, total: requiredDays })
            : t('core:ai.error1'),
      );
    }
  };

  // Блок награды-заряда: войти / мало дней / забрать / уже получено.
  const reward = !isAuthenticated ? (
    <Text role="body" tone="ink100">
      {t('achievements:reward.signIn')}
    </Text>
  ) : statusLoading ? null : claimed ? (
    <Text role="body" tone="ink100">
      {t('achievements:reward.already')}
    </Text>
  ) : enoughDays && allCompleted ? (
    <Button
      variant="action"
      fullWidth
      loading={claiming}
      icon={<ChargeMark size="md" onAction />}
      iconPosition="end"
      onClick={handleClaim}
    >
      {t('achievements:reward.claim')}
    </Button>
  ) : (
    <Text role="body" tone="ink100">
      {t('achievements:reward.progress', { done: daysDone, total: requiredDays })}
    </Text>
  );

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('achievements:header')} />
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <CheckIcon width={40} height={40} aria-hidden="true" />
          </div>
          <Text role="title" as="h1" className={styles.title}>
            {allCompleted ? t('achievements:title') : t('achievements:titleProgress')}
          </Text>
          <span className={styles.badge}>
            {t('achievements:reward.badge')}
            <ChargeMark size="sm" />
          </span>
          <Text role="body" tone="ink100" className={styles.description}>
            {allCompleted ? t('achievements:description') : t('achievements:descriptionProgress')}
          </Text>
          <div className={styles.rewardBox}>
            <div className={styles.dayTrack} role="img" aria-label={t('achievements:reward.progress', { done: daysDone, total: requiredDays })}>
              {Array.from({ length: requiredDays }, (_, i) => (
                <span key={i} className={[styles.daySeg, i < daysDone ? styles.daySegOn : ''].filter(Boolean).join(' ')} />
              ))}
            </div>
            {reward}
          </div>
          {allCompleted ? (
            <Button variant="link" onClick={openWeekCard}>
              {t('achievements:cta')}
            </Button>
          ) : (
            <Button variant="link" onClick={() => navigate('/habits/week')}>
              {t('achievements:toGoals')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
