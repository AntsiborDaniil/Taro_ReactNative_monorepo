import { Fragment, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpreadName, TarotCardDirection } from '@legacy-data';
import { CARD_STUDY_GROUPS, cardStudyPositionLabelKey } from '@entities/spread';
import { ChevronRightIcon, ModalSheet, Radio, Text } from '@shared/ui';
import styles from './CardStudy.module.css';

const KEYWORDS_COUNT = 4;
const ALL_SPREADS = CARD_STUDY_GROUPS.flatMap((group) => group.spreads);

/**
 * Учебная часть карточки карты (библиотека/словарь): ключевые слова, ответ
 * «да/нет», совет и значения карты в позициях выбранного расклада. Тексты уже
 * лежат в card.json; отсутствующие ключи (у en есть пропуски) молча скрываются.
 */
export function CardStudy({ cardId, direction }: { cardId: string; direction: TarotCardDirection }): ReactElement {
  const { t, i18n } = useTranslation();
  const [spreadId, setSpreadId] = useState<SpreadName>(ALL_SPREADS[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);

  const text = (key: string): string => (i18n.exists(key) ? t(key) : '');
  const base = `card:${cardId}`;

  const keywords = Array.from({ length: KEYWORDS_COUNT }, (_, i) => text(`${base}.keyword.${direction}.default.${i}`)).filter(
    Boolean,
  );
  const yesNo = text(`${base}.yesNo.${direction}.0`);
  const advice = text(`${base}.advice.${direction}.default.0`);

  const spread = ALL_SPREADS.find((item) => item.id === spreadId) ?? ALL_SPREADS[0];
  const rows =
    spread.positions === 0
      ? [{ index: 0, label: '', body: text(`${base}.meaning.${direction}.${spread.id}.0`) }]
      : Array.from({ length: spread.positions }, (_, i) => ({
          index: i,
          label: t(cardStudyPositionLabelKey(spread.id, i)),
          body: text(`${base}.meaning.${direction}.${spread.id}.${i}`),
        }));

  return (
    <>
      {keywords.length > 0 || yesNo ? (
        <section className={styles.panel}>
          {keywords.length > 0 ? (
            <>
              <Text role="label" tone="ink100" as="h2">
                {t('core:cardStudy.keywords')}
              </Text>
              <div className={styles.keywords}>
                {keywords.map((word) => (
                  <span key={word} className={styles.keyword}>
                    {word}
                  </span>
                ))}
              </div>
            </>
          ) : null}
          {yesNo ? (
            <div className={styles.yesNo}>
              <Text role="body" tone="ink100" as="span">
                {t('core:cardStudy.yesNo')}
              </Text>
              <span className={styles.yesNoValue}>{yesNo}</span>
            </div>
          ) : null}
        </section>
      ) : null}

      {advice ? (
        <section className={styles.panel}>
          <Text role="label" tone="ink100" as="h2">
            {t('core:cardStudy.advice')}
          </Text>
          <Text role="body" tone="ink100">
            {advice}
          </Text>
        </section>
      ) : null}

      <section className={styles.panel}>
        <Text role="label" tone="ink100" as="h2">
          {t('core:cardStudy.spreads.title')}
        </Text>
        <Text role="body" tone="ink100">
          {t('core:cardStudy.spreads.hint')}
        </Text>

        <button
          type="button"
          className={styles.select}
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${t('core:cardStudy.spreads.select')}: ${t(spread.nameKey)}`}
        >
          <span className={styles.selectValue}>{t(spread.nameKey)}</span>
          <ChevronRightIcon width={20} height={20} className={styles.selectChevron} />
        </button>

        <ol className={styles.positions}>
          {rows.map((row) =>
            row.body ? (
              <li key={row.index} className={styles.position}>
                {row.label ? (
                  <span className={styles.positionHead}>
                    <span className={styles.positionIndex}>{row.index + 1}</span>
                    <span className={styles.positionLabel}>{row.label}</span>
                  </span>
                ) : null}
                <Text role="body" tone="ink100">
                  {row.body}
                </Text>
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <ModalSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title={t('core:cardStudy.spreads.select')}>
        <div className={styles.picker}>
          {CARD_STUDY_GROUPS.map((group) => (
            <Fragment key={group.id}>
              <Text role="label" tone="ink100" as="h3" className={styles.pickerGroup}>
                {t(`core:cardStudy.group.${group.id}`)}
              </Text>
              <div role="radiogroup" className={styles.pickerOptions}>
                {group.spreads.map((item) => (
                  <Radio
                    key={item.id}
                    name="card-study-spread"
                    value={item.id}
                    label={t(item.nameKey)}
                    checked={item.id === spread.id}
                    onChange={() => {
                      setSpreadId(item.id);
                      setPickerOpen(false);
                    }}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      </ModalSheet>
    </>
  );
}
