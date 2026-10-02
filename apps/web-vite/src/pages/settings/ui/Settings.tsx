import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@entities/settings';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { setThemePreference, useThemePreference, type ThemePreference } from '@shared/lib/theme';
import { AnalyticAction, track } from '@shared/lib/analytics';
import {
  checkTelegramHomeScreenStatus,
  isTelegramMiniApp,
  onTelegramHomeScreenAdded,
  requestTelegramAddToHomeScreen,
  supportsAddToHomeScreen,
} from '@shared/lib/web/telegramWebApp';
import {
  readHomeScreenPromptState,
  writeHomeScreenPromptState,
} from '@features/telegramHomeScreen';
import {
  BookIcon,
  Chip,
  Header,
  LanguageIcon,
  LightningIcon,
  ListRow,
  openModal,
  PaintIcon,
  PlusIcon,
  ReverseIcon,
  Switch,
  Text,
  ThemeIcon,
  useToast,
} from '@shared/ui';
import styles from './Settings.module.css';

/**
 * Перенос apps/web/src/pages/settings/ui/Settings.tsx (web-ветка) —
 * группы: Расклады (перевёрнутые карты + покупка зарядов), Внешний вид
 * (тема DS §02, язык, колода), Документы. «Личный кабинет» и «Звук и вибрация»
 * убраны из настроек по решению владельца (маршруты остаются).
 */
export default function SettingsPage(): ReactElement {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { settings, updateSetting, handleVibrationClick } = useSettings();
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const theme = useThemePreference();
  /** Показывать строку «на домашний экран» только в Mini App, пока ярлык не добавлен. */
  const [showHomeScreenRow, setShowHomeScreenRow] = useState(false);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      if (!isTelegramMiniApp() || !supportsAddToHomeScreen()) {
        if (alive) setShowHomeScreenRow(false);
        return;
      }
      const stored = readHomeScreenPromptState();
      if (stored === 'added' || stored === 'unsupported') {
        if (alive) setShowHomeScreenRow(false);
        return;
      }
      const status = await checkTelegramHomeScreenStatus();
      if (!alive) return;
      if (status === 'added') {
        writeHomeScreenPromptState('added');
        setShowHomeScreenRow(false);
        return;
      }
      if (status === 'unsupported') {
        writeHomeScreenPromptState('unsupported');
        setShowHomeScreenRow(false);
        return;
      }
      setShowHomeScreenRow(true);
    };
    void sync();
    const unsub = onTelegramHomeScreenAdded(() => {
      writeHomeScreenPromptState('added');
      if (alive) {
        setShowHomeScreenRow(false);
        toast.success(t('settings:homeScreen.added'));
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [t, toast]);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'dark', label: t('settings:theme.dark') },
    { value: 'light', label: t('settings:theme.light') },
  ];

  const handleReversedChange = (checked: boolean) => {
    handleVibrationClick();
    updateSetting('spread', { hasReversed: checked });
  };

  const handleBuyCredits = () => {
    handleVibrationClick();
    track(AnalyticAction.ClickSettingsSegment, { segment: 'credits.buy' });
    dispatch(openModal({ id: 'buy-credits' }));
  };

  const handleAddToHomeScreen = () => {
    handleVibrationClick();
    track(AnalyticAction.ClickSettingsSegment, { segment: 'homeScreen' });
    const ok = requestTelegramAddToHomeScreen();
    if (!ok) {
      writeHomeScreenPromptState('unsupported');
      setShowHomeScreenRow(false);
      toast.info(t('settings:homeScreen.unsupported'));
    }
    // Успех — через onTelegramHomeScreenAdded в useEffect выше.
  };

  return (
    <div className={styles.page}>
      {/* Header внутри .column — как на /spreads и /library: тот же горизонтальный gutter. */}
      <div className={styles.column}>
        <Header title={t('settings:settings')} />
        <section className={styles.section}>
          <Text role="label" as="h2" className={styles.sectionTitle}>
            {t('settings:section.game')}
          </Text>
          <div className={styles.group}>
            <ListRow
              leadingIcon={<ReverseIcon width={22} height={22} />}
              title={t('settings:hasReversed')}
              trailing={
                <Switch
                  checked={settings.spread?.hasReversed ?? true}
                  onChange={(event) => handleReversedChange(event.target.checked)}
                  aria-label={t('settings:hasReversed')}
                />
              }
            />
            <ListRow
              leadingIcon={<LightningIcon width={22} height={22} />}
              title={t('settings:credits.buy.row')}
              subtitle={t('settings:credits.buy.rowHint', { count: spreadCredits ?? 0 })}
              onClick={handleBuyCredits}
            />
          </div>
        </section>

        <section className={styles.section}>
          <Text role="label" as="h2" className={styles.sectionTitle}>
            {t('settings:section.look')}
          </Text>
          <div className={styles.group}>
            <div className={styles.themeRow}>
              <div className={styles.themeHead}>
                <ThemeIcon width={22} height={22} className={styles.themeIcon} />
                <Text role="body" tone="ink50">
                  {t('settings:theme.title')}
                </Text>
              </div>
              <div className={styles.themeOptions} role="radiogroup" aria-label={t('settings:theme.title')}>
                {themeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    role="radio"
                    aria-checked={theme === option.value}
                    selected={theme === option.value}
                    onClick={() => {
                      handleVibrationClick();
                      setThemePreference(option.value);
                    }}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>
            <ListRow
              leadingIcon={<LanguageIcon width={22} height={22} />}
              title={t('settings:language')}
              to="/settings/language"
            />
            <ListRow
              leadingIcon={<PaintIcon width={22} height={22} />}
              title={t('settings:deck.style')}
              to="/settings/deck"
            />
          </div>
        </section>

        {showHomeScreenRow ? (
          <section className={styles.section}>
            <Text role="label" as="h2" className={styles.sectionTitle}>
              {t('settings:section.mobile')}
            </Text>
            <div className={styles.group}>
              <ListRow
                leadingIcon={<PlusIcon width={22} height={22} />}
                title={t('settings:homeScreen.row')}
                subtitle={t('settings:homeScreen.rowHint')}
                onClick={handleAddToHomeScreen}
              />
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <Text role="label" as="h2" className={styles.sectionTitle}>
            {t('settings:section.legal')}
          </Text>
          <div className={styles.group}>
            <ListRow
              leadingIcon={<BookIcon width={22} height={22} />}
              title={t('settings:legal.title')}
              subtitle={t('settings:legal.row.hint')}
              to="/documents"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
