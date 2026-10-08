import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { haptic } from '@shared/lib/haptics';
import { Button, ChevronRightIcon, Text } from '@shared/ui';
import { RiffleShuffle } from './RiffleShuffle';
import styles from './DeckRitual.module.css';

/** Рубашек в стопке церемонии; верхние TOP_HALF — «снимаемая» половина. */
const STACK_SIZE = 7;
const TOP_HALF = 3;
/** Длительность одного хода снятия = --ds-dur-block. */
const CUT_STEP_MS = 400;
const CUT_THRESHOLD_PX = 64;
const FLICK_VELOCITY = 0.5; // px/ms
const TAP_TOLERANCE_PX = 8;

export type DeckRitualStage = 'shuffle' | 'cut';

type DeckRitualProps = {
  stage: DeckRitualStage;
  /** Сколько рифлов (3; для карты дня — 1). */
  riffles: number;
  reducedMotion: boolean;
  onShuffleDone: () => void;
  /** Колода снята (половина легла под низ) — дальше раскрытие в coverflow. */
  onCutDone: () => void;
  /** Пропустить всю церемонию. */
  onSkip: () => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  prevX: number;
  prevT: number;
  velocity: number;
  moved: boolean;
  overThreshold: boolean;
};

type CutState = 'idle' | 'dragging' | 'away' | 'under';

/**
 * Церемония расклада на месте колоды: shuffle (рифл-перемешивание, RiffleShuffle) →
 * cut (верхняя половина идёт за пальцем, порог 64px или флик >0.5px/ms,
 * иначе пружинит назад). Анимации — только transform/opacity. Тап по стопке,
 * Enter/Space и кнопка «Снять колоду» — запасной путь для десктопа и a11y;
 * при prefers-reduced-motion свайп заменён тапом, подсказка статична.
 * Хаптика остаётся и в reduced-motion.
 */
export function DeckRitual({
  stage,
  riffles,
  reducedMotion,
  onShuffleDone,
  onCutDone,
  onSkip,
}: DeckRitualProps): ReactElement {
  const { t } = useTranslation();
  const topRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const timersRef = useRef<number[]>([]);
  const [cutState, setCutState] = useState<CutState>('idle');

  const schedule = useCallback((fn: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(fn, delay));
  }, []);

  useEffect(() => {
    const timers = timersRef;
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  // Shuffle: рифлы рисует RiffleShuffle (сам ведёт тайминг и хаптику); в reduced-motion — сразу к снятию.
  const onShuffleDoneRef = useRef(onShuffleDone);
  onShuffleDoneRef.current = onShuffleDone;
  useEffect(() => {
    if (stage === 'shuffle' && reducedMotion) onShuffleDoneRef.current();
  }, [stage, reducedMotion]);

  const setTopTransform = (x: number, withTransition: boolean) => {
    const el = topRef.current;
    if (!el) return;
    el.style.transition = withTransition ? `transform ${CUT_STEP_MS}ms var(--ds-ease)` : 'none';
    el.style.transform = x === 0 && withTransition ? '' : `translateX(${x}px) rotate(${x / 14}deg)`;
  };

  const startCut = (direction: 1 | -1) => {
    if (stage !== 'cut' || cutState === 'away' || cutState === 'under') return;
    if (reducedMotion) {
      haptic.impact('heavy');
      onCutDone();
      return;
    }
    const width = topRef.current?.offsetWidth ?? 92;
    setCutState('away');
    setTopTransform(direction * width * 1.15, true);
    schedule(() => {
      // Половина ушла в сторону — переводим её под низ и возвращаем в центр.
      setCutState('under');
      setTopTransform(0, true);
    }, CUT_STEP_MS);
    schedule(() => {
      haptic.impact('heavy');
      onCutDone();
    }, CUT_STEP_MS * 2);
  };

  const springBack = () => {
    setCutState('idle');
    setTopTransform(0, true);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (stage !== 'cut' || cutState !== 'idle' || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      prevX: event.clientX,
      prevT: event.timeStamp,
      velocity: 0,
      moved: false,
      overThreshold: false,
    };
    if (!reducedMotion) stackRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || reducedMotion) return;
    const dx = event.clientX - drag.startX;
    const dt = event.timeStamp - drag.prevT;
    if (dt > 0) {
      // Сглаженная скорость последних движений (px/ms).
      drag.velocity = 0.6 * ((event.clientX - drag.prevX) / dt) + 0.4 * drag.velocity;
      drag.prevX = event.clientX;
      drag.prevT = event.timeStamp;
    }
    if (!drag.moved && Math.abs(dx) > TAP_TOLERANCE_PX) {
      drag.moved = true;
      setCutState('dragging');
    }
    if (!drag.moved) return;
    const limit = (topRef.current?.offsetWidth ?? 92) * 1.3;
    setTopTransform(Math.max(-limit, Math.min(limit, dx)), false);
    const over = Math.abs(dx) >= CUT_THRESHOLD_PX;
    if (over !== drag.overThreshold) {
      drag.overThreshold = over;
      haptic.selection();
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      // Тап по стопке — то же, что кнопка «Снять колоду».
      startCut(1);
      return;
    }
    const flick = Math.abs(drag.velocity) > FLICK_VELOCITY;
    if (Math.abs(dx) >= CUT_THRESHOLD_PX || flick) {
      startCut((flick ? drag.velocity : dx) >= 0 ? 1 : -1);
    } else {
      springBack();
    }
  };

  const onPointerCancel = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) springBack();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      startCut(1);
    }
  };

  const isShuffle = stage === 'shuffle';
  const cutBusy = cutState === 'away' || cutState === 'under';

  return (
    <div className={styles.ritual}>
      <div className={styles.stage}>
        {isShuffle && !reducedMotion ? (
          <div className={styles.stack} role="img" aria-label={t('core:choice.ritual.shuffling')}>
            <RiffleShuffle riffles={riffles} onDone={() => onShuffleDoneRef.current()} />
          </div>
        ) : (
        <div
          ref={stackRef}
          className={[styles.stack, isShuffle ? '' : styles.stackCut, cutState === 'dragging' ? styles.stackDragging : ''].join(' ')}
          role={isShuffle ? 'img' : 'button'}
          tabIndex={isShuffle ? -1 : 0}
          aria-label={isShuffle ? t('core:choice.ritual.shuffling') : t('core:choice.ritual.stackLabel')}
          aria-disabled={cutBusy || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
        >
          <div className={styles.half}>
            {Array.from({ length: STACK_SIZE - TOP_HALF }, (_, k) => k + TOP_HALF).map((i) => (
              <RitualCard key={i} index={i} />
            ))}
          </div>
          <div
            ref={topRef}
            className={[styles.half, styles.halfTop, cutState === 'under' ? styles.halfUnder : ''].join(' ')}
          >
            {Array.from({ length: TOP_HALF }, (_, i) => i).map((i) => (
              <RitualCard key={i} index={i} />
            ))}
          </div>
        </div>
        )}
      </div>

      <div className={styles.controls}>
        {isShuffle ? (
          <>
            <span role="status">
              <Text role="label" tone="ink100">
                {t('core:choice.ritual.shuffling')}
              </Text>
            </span>
            <Button type="button" variant="link" onClick={onSkip}>
              {t('core:choice.ritual.skip')}
            </Button>
          </>
        ) : (
          <>
            <div className={styles.hintRow}>
              <span role="status">
                <Text role="label" tone="ink100">
                  {reducedMotion ? t('core:choice.ritual.cutHintTap') : t('core:choice.ritual.cutHint')}
                </Text>
              </span>
              {reducedMotion ? null : <ChevronRightIcon width={18} height={18} className={styles.hintArrow} aria-hidden="true" />}
            </div>
            <Button type="button" variant="link" disabled={cutBusy} onClick={() => startCut(1)}>
              {t('core:choice.ritual.cutButton')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function RitualCard({ index }: { index: number }): ReactElement {
  return (
    <span className={styles.card} style={{ '--i': index } as CSSProperties}>
      <TarotCardFace faceDown />
    </span>
  );
}
