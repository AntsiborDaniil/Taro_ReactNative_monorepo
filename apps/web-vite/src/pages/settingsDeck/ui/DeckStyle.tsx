import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { DeckStyle, useSettings } from '@entities/settings';
import { TarotCardFace } from '@entities/spread';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { CheckIcon, Header, Text } from '@shared/ui';
import styles from './DeckStyle.module.css';

const DECK_STYLES: { id: DeckStyle; labelKey: string }[] = [
  { id: DeckStyle.FlatIllustration, labelKey: 'settings:deck.style.flat' },
  { id: DeckStyle.RiderWaiteOriginal, labelKey: 'settings:deck.style.classic' },
  { id: DeckStyle.ModernMysticalMinimalism, labelKey: 'settings:deck.style.modern' },
];

/**
 * Перенос apps/web/src/pages/settings/ui/DeckStyle/DeckStyle.tsx — превью
 * карты #0 (Шут) в каждом стиле. Выбор сразу влияет на TarotCardFace
 * (читает state.settings). Header вне сетки превью; выбор — radiogroup.
 */
export default function DeckStylePage(): ReactElement {
  const { t } = useTranslation();
  const { settings, updateSetting, handleVibrationClick } = useSettings();
  const current = settings.appearance?.deckStyle ?? DeckStyle.FlatIllustration;

  const handleSelect = (deckStyle: DeckStyle) => {
    handleVibrationClick();
    updateSetting('appearance', { deckStyle });
    track(AnalyticAction.ClickChangeDeckStyle, { style: deckStyle });
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('settings:deck.style')} />
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label={t('settings:deck.style')}
        >
          {DECK_STYLES.map((option) => {
            const selected = option.id === current;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.item, selected ? styles.itemSelected : ''].filter(Boolean).join(' ')}
                onClick={() => handleSelect(option.id)}
              >
                <span className={styles.previewWrap}>
                  <TarotCardFace cardId="0" deckStyle={option.id} />
                  {selected ? <CheckIcon width={18} height={18} className={styles.check} /> : null}
                </span>
                <Text role="label" as="span" className={styles.label}>
                  {t(option.labelKey)}
                </Text>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
