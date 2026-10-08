import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { MAJOR_EXPECTED_SHARE, SUIT_COLOR, SUIT_ICON } from '@entities/spread';
import { Text } from '@shared/ui';
import type { MirrorResult } from '../model/computeMirror';
import styles from '../Mirror.module.css';

/**
 * Итог недели одной карточкой: под каким знаком прошла неделя (доминирующая
 * масть и её тема) + 4 плитки-показателя. Первое, что видит человек, — вывод,
 * а не таблица.
 */
export function MirrorHero({ result, showReversed }: { result: MirrorResult; showReversed: boolean }): ReactElement {
  const { t } = useTranslation();
  const suit = result.dominantSuit;
  const Icon = suit ? SUIT_ICON[suit] : null;
  const majorExpected = Math.round(MAJOR_EXPECTED_SHARE * 100);

  const tiles = [
    { key: 'spreads', value: String(result.spreadsCount), label: t('main:mirror.tile.spreads', { count: result.spreadsCount }) },
    { key: 'cards', value: String(result.cardsCount), label: t('main:mirror.tile.cards', { count: result.cardsCount }) },
    { key: 'major', value: `${result.majorSharePercent}%`, label: t('main:mirror.tile.major', { expected: majorExpected }) },
    ...(showReversed
      ? [{ key: 'reversed', value: `${result.reversedPercent}%`, label: t('main:mirror.tile.reversed') }]
      : []),
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroHead}>
        {Icon && suit ? (
          <span className={styles.heroIcon} style={{ color: SUIT_COLOR[suit] }}>
            <Icon width={28} height={28} aria-hidden="true" />
          </span>
        ) : null}
        <div className={styles.heroText}>
          <Text role="label" tone="accent" as="p">
            {t('main:mirror.hero.label')}
          </Text>
          <Text role="title" tone="ink50" as="h2">
            {suit ? t(`main:mirror.hero.suit.${suit}`) : t('main:mirror.hero.balanced')}
          </Text>
        </div>
      </div>
      <Text role="body" tone="ink100">
        {suit ? t(`main:mirror.hero.text.${suit}`) : t('main:mirror.hero.text.balanced')}
      </Text>
      <dl className={styles.tiles}>
        {tiles.map((tile) => (
          <div key={tile.key} className={styles.tile}>
            <dd className={styles.tileValue}>{tile.value}</dd>
            <dt className={styles.tileLabel}>{tile.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
