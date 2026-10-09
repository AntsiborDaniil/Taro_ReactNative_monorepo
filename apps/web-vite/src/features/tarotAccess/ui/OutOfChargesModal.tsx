import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { getImage } from '@shared/lib/getImage';
import { haptic } from '@shared/lib/haptics';
import { useAppDispatch } from '@shared/lib/store';
import { Button, ChargeMark, CheckIcon, LightningIcon, ListRow, SmartImage, Text } from '@shared/ui';
import { closeModal, openModal, type ModalComponentProps } from '@shared/ui/ModalSheet';
import styles from './OutOfChargesModal.module.css';

const MODAL_ID = 'out-of-charges';
const DAY_MS = 24 * 60 * 60 * 1000;

/** До ближайших 10:00 МСК (= 07:00 UTC) — тогда сервер выдаёт новый бесплатный расклад (tarot_daily_usage.day). */
function untilRefill(now = Date.now()): { hours: number; minutes: number; dayProgress: number } {
  const next = new Date(now);
  next.setUTCHours(7, 0, 0, 0);
  if (next.getTime() <= now) next.setUTCDate(next.getUTCDate() + 1);
  const left = Math.max(0, next.getTime() - now);
  return {
    hours: Math.floor(left / 3_600_000),
    minutes: Math.floor((left % 3_600_000) / 60_000),
    dayProgress: 1 - left / DAY_MS,
  };
}

/**
 * Бесплатный расклад на сегодня уже использован (до старта платного расклада).
 * Акцент — не «денег нет», а «новый бесплатный скоро»: таймер до обновления и
 * что можно сделать бесплатно прямо сейчас (карты дня/недели/месяца, Зеркало, цели).
 * Пополнение — тихая кнопка внизу без цены, не продажа «в лоб»; закрыть — крестик.
 * «Пополнить» заменяет лист покупкой (а не кладёт сверху).
 */
/** Почему не хватило зарядов: обычный расклад, глубокий разбор (⚡2) или уточнение (только купленные заряды). */
export type OutOfChargesReason = 'spread' | 'deep' | 'followUp';

export function OutOfChargesModal({ reason = 'spread' }: ModalComponentProps & { reason?: OutOfChargesReason }): ReactElement {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [refill, setRefill] = useState(untilRefill);

  useEffect(() => {
    const id = window.setInterval(() => setRefill(untilRefill()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.outOfChargesOpen, { reason });
  }, [reason]);

  const goTo = (target: 'free_spreads' | 'mirror' | 'goals', action: () => void) => {
    reachMetrikaGoal(MetrikaGoal.outOfChargesFreeClick, { target });
    haptic.selection();
    dispatch(closeModal(MODAL_ID));
    action();
  };

  const handleTopUp = () => {
    reachMetrikaGoal(MetrikaGoal.outOfChargesTopup, { reason });
    haptic.impact('light');
    dispatch(closeModal(MODAL_ID));
    dispatch(openModal({ id: 'buy-credits' }));
  };

  return (
    <div className={styles.root}>
      <section className={styles.timer} aria-live="polite">
        <span className={styles.badge} aria-hidden="true">
          <LightningIcon width={28} height={28} />
        </span>
        <span className={styles.timerText}>
          <Text role="label" tone="accent" as="span">
            {t('spread:outOfCharges.refillLabel')}
          </Text>
          <Text role="title" tone="ink50" as="span">
            {t('spread:outOfCharges.refillIn', { hours: refill.hours, minutes: refill.minutes })}
          </Text>
        </span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} style={{ width: `${Math.round(refill.dayProgress * 100)}%` }} />
        </span>
      </section>

      <Text role="body" tone="ink100" className={styles.lead}>
        {t(reason === 'spread' ? 'spread:outOfCharges.body' : `spread:outOfCharges.body.${reason}`)}
      </Text>

      <div className={styles.free}>
        <Text role="label" tone="ink100" as="h3" className={styles.freeTitle}>
          {t('spread:outOfCharges.whileWaiting')}
        </Text>
        <ListRow
          leadingIcon={<SmartImage className={styles.thumb} src={getImage(['core', 'girl'])} />}
          title={t('spread:outOfCharges.freeSpreads')}
          subtitle={t('spread:outOfCharges.freeSpreadsHint')}
          onClick={() => goTo('free_spreads', () => navigate('/spreads#free'))}
        />
        <ListRow
          leadingIcon={<SmartImage className={styles.thumb} src={getImage(['core', 'mirror'])} />}
          title={t('spread:outOfCharges.mirror')}
          subtitle={t('spread:outOfCharges.mirrorHint')}
          onClick={() => goTo('mirror', () => navigate('/mirror'))}
        />
        <ListRow
          leadingIcon={
            <span className={styles.goalIcon}>
              <CheckIcon width={24} height={24} />
            </span>
          }
          title={t('spread:outOfCharges.goals')}
          subtitle={t('spread:outOfCharges.goalsHint')}
          onClick={() => goTo('goals', () => navigate('/habits/week'))}
        />
      </div>

      {/* Пополнение — тихая второстепенная кнопка: главный путь здесь — подождать
          или заняться бесплатным, а не покупка. Цена — уже в листе покупки. */}
      <Button
        variant="quiet"
        quietTone="neutral"
        fullWidth
        className={styles.topUp}
        icon={<ChargeMark size="sm" />}
        iconPosition="end"
        onClick={handleTopUp}
      >
        {t('spread:outOfCharges.cta')}
      </Button>
    </div>
  );
}
