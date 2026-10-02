import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addHabit, HabitType, type THabit } from '@entities/habits';
import { useAppDispatch } from '@shared/lib/store';
import { getDateISO, getLocalizedWeekdays } from '@shared/lib/date';
import { Button, Chip, Header, Input, Switch, Text } from '@shared/ui';
import styles from './HabitNew.module.css';

/**
 * Перенос логики apps/web/src/pages/habitCreate (без emoji/цвет-пикера — вне
 * задачи): название, дни недели (build), дата старта/напоминание через
 * нативные input[type=date|time], автозаполнение (quit). Одна кнопка
 * действия — «Создать».
 */
export default function HabitNewPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const habitType = searchParams.get('type') === HabitType.QuitNegative ? HabitType.QuitNegative : HabitType.BuildPositive;
  const isBuild = habitType === HabitType.BuildPositive;

  const today = useMemo(() => getDateISO(new Date()), []);
  const weekDays = useMemo(() => getLocalizedWeekdays(i18n.language), [i18n.language]);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [reminderTime, setReminderTime] = useState('');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(true);

  const pageTitle = isBuild ? t('habits:page.habitCreateBuild') : t('habits:page.habitCreateQuit');

  const toggleDay = (index: number) => {
    setFrequencyDays((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const habit: THabit = {
      id: Date.now().toString(),
      title: title.trim(),
      isActive: true,
      type: habitType,
      startDate,
      endDate: null,
      frequencyDays: isBuild ? frequencyDays : undefined,
      isAutoFillEnabled: !isBuild ? isAutoFillEnabled : undefined,
      progress: {},
      reminderTime: reminderTime || null,
    };

    dispatch(addHabit(habit));
    navigate('/habits/week');
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={pageTitle} />

        <div className={styles.card}>
          <Input
            label={t('habits:placeholder.habitTitle')}
            placeholder={t('habits:placeholder.habitTitle')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        {isBuild ? (
          <div className={styles.card}>
            <Text role="label" tone="ink100">
              {t('habits:title.frequency')}
            </Text>
            <div className={styles.days}>
              {weekDays.map((day) => (
                <Chip key={day.index} selected={frequencyDays.includes(day.index)} onClick={() => toggleDay(day.index)}>
                  {day.day}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {!isBuild ? (
          <div className={styles.card}>
            <Switch
              checked={isAutoFillEnabled}
              onChange={(event) => setIsAutoFillEnabled(event.target.checked)}
              label={t('habits:title.autoFill')}
            />
            <Text role="body" tone="ink100">
              {t('habits:description.autoFill')}
            </Text>
          </div>
        ) : null}

        <div className={styles.card}>
          <div className={styles.row}>
            <Input
              type="date"
              label={t('habits:title.startDate')}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              type="time"
              label={t('habits:label.reminder')}
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
            />
          </div>
        </div>

        <Button fullWidth disabled={!title.trim()} onClick={handleSubmit}>
          {t('habits:button.create')}
        </Button>
      </div>
    </div>
  );
}
