import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@shared/i18n';
import type { AppLanguage } from '@shared/i18n/namespaces';
import { useSettings } from '@entities/settings';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { CheckIcon, Header, SmartImage } from '@shared/ui';
import ruFlag from '@legacy-icons/Ru.svg';
import enFlag from '@legacy-icons/En.svg';
import styles from './Language.module.css';

const LANGUAGES: { labelKey: string; value: AppLanguage; flag: string }[] = [
  { labelKey: 'settings:language.options.ru', value: 'ru', flag: ruFlag },
  { labelKey: 'settings:language.options.en', value: 'en', flag: enFlag },
];

/**
 * Перенос apps/web/src/pages/settings/ui/Language/LanguagePickerBody.tsx
 * (screen-вариант; модалка из Settings не переносилась отдельно — страница
 * одна и та же, открывается по /settings/language). Флаги — SVG из
 * apps/web/src/shared/icons (не копируются, импорт как url).
 */
export default function LanguagePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { handleVibrationClick } = useSettings();

  const handleChange = async (lang: AppLanguage) => {
    if (lang === i18n.language) return;
    handleVibrationClick();
    await changeLanguage(lang);
    track(AnalyticAction.ClickChangeLanguage, { lang });
  };

  return (
    <div className={styles.page}>
      <Header title={t('settings:language')} />
      <div className={styles.column}>
        {LANGUAGES.map((language) => {
          const selected = language.value === i18n.language;
          return (
            <button
              key={language.value}
              type="button"
              className={[styles.item, selected ? styles.itemSelected : ''].filter(Boolean).join(' ')}
              aria-pressed={selected}
              onClick={() => handleChange(language.value)}
            >
              <span className={styles.itemLeft}>
                <SmartImage className={styles.flag} src={language.flag} />
                <span>{t(language.labelKey)}</span>
              </span>
              {selected ? <CheckIcon width={22} height={22} className={styles.check} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
