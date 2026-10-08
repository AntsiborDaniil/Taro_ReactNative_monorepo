import { useEffect, useRef, type ReactElement } from 'react';
import { TarotCardFace } from '@entities/spread';
import { haptic } from '@shared/lib/haptics';
import styles from './DeckRitual.module.css';

/** Рубашек в перемешивании: больше, чем в стопке снятия, — рифл выглядит плотнее. */
const SHUFFLE_CARDS = 12;
/** Один рифл: раскол → наклон → карты падают вперемешку → выравнивание. */
export const RIFFLE_CYCLE_MS = 1000;
/** Пауза между рифлами — колода «вздыхает» перед следующим. */
const CYCLE_GAP_MS = 80;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

type RiffleShuffleProps = {
  riffles: number;
  onDone: () => void;
};

/**
 * Рифл-перемешивание (Web Animations API, только transform/opacity):
 * 1) колода раскалывается на две стопки влево/вправо;
 * 2) стопки наклоняются внутренними углами друг к другу;
 * 3) карты по одной падают в центр, чередуясь слева/справа (как настоящий рифл);
 * 4) колода выравнивается с лёгким отскоком и золотой вспышкой.
 * Хаптика — в такт падающим картам и на выравнивании.
 */
export function RiffleShuffle({ riffles, onDone }: RiffleShuffleProps): ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-card]'));
    const glow = root.querySelector<HTMLElement>('[data-glow]');
    const sparks = Array.from(root.querySelectorAll<HTMLElement>('[data-spark]'));
    const width = cards[0]?.offsetWidth ?? 92;
    const animations: Animation[] = [];
    const timers: number[] = [];
    let cancelled = false;

    const half = SHUFFLE_CARDS / 2;
    // Порядок падения: L0, R0, L1, R1… (нижние карты падают первыми).
    const dropOrder = (side: -1 | 1, k: number) => k * 2 + (side === -1 ? 0 : 1);
    const lift = (n: number) => -n * 1.1;

    const runCycle = (cycle: number) => {
      if (cancelled) return;
      cards.forEach((el, i) => {
        // Нижняя половина колоды — влево, верхняя — вправо.
        const side: -1 | 1 = i < half ? -1 : 1;
        const k = i < half ? i : i - half;
        const f = dropOrder(side, k);
        el.style.zIndex = String(f + 1);
        const dropStart = 0.44 + (f / SHUFFLE_CARDS) * 0.3;
        const dropEnd = Math.min(dropStart + 0.07, 0.86);
        const splitX = side * width * 0.6;
        const tiltX = side * width * 0.5;
        const kf: Keyframe[] = [
          { offset: 0, transform: `translate(0px, ${lift(i)}px) rotate(0deg)` },
          { offset: 0.2, transform: `translate(${splitX}px, ${lift(k) - 6}px) rotate(${side * 4}deg)`, easing: EASE },
          // Наклон внутренними углами к центру (левая стопка — по часовой).
          { offset: 0.4, transform: `translate(${tiltX}px, ${lift(k) - 14}px) rotate(${-side * 13}deg)` },
          { offset: dropStart, transform: `translate(${tiltX}px, ${lift(k) - 14}px) rotate(${-side * 13}deg)`, easing: 'ease-in' },
          { offset: dropEnd, transform: `translate(${side * width * 0.06}px, ${lift(f)}px) rotate(${-side * 2}deg)`, easing: EASE },
          { offset: 0.88, transform: `translate(0px, ${lift(f)}px) rotate(0deg)` },
          { offset: 0.94, transform: `translate(0px, ${lift(f) - 3}px) rotate(0deg) scale(1.03)` },
          { offset: 1, transform: `translate(0px, ${lift(f)}px) rotate(0deg) scale(1)` },
        ];
        animations.push(el.animate(kf, { duration: RIFFLE_CYCLE_MS, fill: 'forwards' }));
      });

      if (glow) {
        animations.push(
          glow.animate(
            [
              { offset: 0, opacity: 0.25, transform: 'scale(0.9)' },
              { offset: 0.4, opacity: 0.45, transform: 'scale(1.25, 1)' },
              { offset: 0.88, opacity: 0.35, transform: 'scale(1)' },
              { offset: 0.94, opacity: 0.9, transform: 'scale(1.15)' },
              { offset: 1, opacity: 0.3, transform: 'scale(1)' },
            ],
            { duration: RIFFLE_CYCLE_MS, fill: 'forwards' },
          ),
        );
      }
      // Искры разлетаются в момент выравнивания.
      sparks.forEach((el, n) => {
        const angle = (n / sparks.length) * Math.PI * 2 + cycle;
        const dist = width * (0.75 + (n % 3) * 0.15);
        animations.push(
          el.animate(
            [
              { offset: 0, opacity: 0, transform: 'translate(0, 0) scale(0.4)' },
              { offset: 0.88, opacity: 0, transform: 'translate(0, 0) scale(0.4)' },
              { offset: 0.93, opacity: 1, transform: `translate(${Math.cos(angle) * dist * 0.5}px, ${Math.sin(angle) * dist * 0.5}px) scale(1)` },
              { offset: 1, opacity: 0, transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.6)` },
            ],
            { duration: RIFFLE_CYCLE_MS, fill: 'forwards', easing: 'ease-out' },
          ),
        );
      });

      // Хаптика: лёгкие тики на падении (каждая третья карта) и толчок на выравнивании.
      for (let f = 0; f < SHUFFLE_CARDS; f += 3) {
        const at = (0.44 + (f / SHUFFLE_CARDS) * 0.3 + 0.07) * RIFFLE_CYCLE_MS;
        timers.push(window.setTimeout(() => haptic.selection(), at));
      }
      timers.push(window.setTimeout(() => haptic.impact('light'), 0.9 * RIFFLE_CYCLE_MS));

      timers.push(
        window.setTimeout(() => {
          if (cycle + 1 < riffles) runCycle(cycle + 1);
          else onDoneRef.current();
        }, RIFFLE_CYCLE_MS + CYCLE_GAP_MS),
      );
    };

    runCycle(0);
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      animations.forEach((a) => a.cancel());
    };
  }, [riffles]);

  return (
    <div ref={rootRef} className={styles.shuffleDeck} aria-hidden="true">
      <span data-glow className={styles.shuffleGlow} />
      {Array.from({ length: SHUFFLE_CARDS }, (_, i) => (
        <span key={i} data-card className={styles.shuffleCard} style={{ transform: `translateY(${-i * 1.1}px)` }}>
          <TarotCardFace faceDown />
        </span>
      ))}
      {Array.from({ length: 8 }, (_, n) => (
        <span key={`s${n}`} data-spark className={styles.spark} />
      ))}
    </div>
  );
}
