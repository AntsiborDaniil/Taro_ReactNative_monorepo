import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type WheelEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { TarotCardDirection, type SpreadName, type TSelectedTarotCard } from '@legacy-data';
import { getTarotCardReadings, pickRandomCard, TarotCardFace, type TSpread } from '@entities/spread';
import { getImage, DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { useAppSelector } from '@shared/lib/store';
import { ChevronLeftIcon, ChevronRightIcon, Text } from '@shared/ui';
import styles from './CardChoice.module.css';

const DECK_SIZE = 21;
const FLIGHT_DURATION = 520;
/** Сдвиг соседних карт в долях ширины карты, наклон и уход в глубину — coverflow. */
const SPACING = 0.52;
const TILT_DEG = 32;
const DEPTH_PX = 70;
const VISIBLE_RANGE = 6;
const DRAG_CLICK_TOLERANCE = 6;

type CardChoiceProps = {
  spread: TSpread;
  selectedCards: TSelectedTarotCard[];
  onDraw: (card: TSelectedTarotCard) => void;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Выбор карт: coverflow-колода в 3D (перенос идеи apps/web/src/features/carousel
 * CoverFlowCardCarousel). Колода стоит по центру, карты по обе стороны уходят в
 * глубину с наклоном. Листать — перетаскиванием (мышь/палец), горизонтальным
 * колесом трекпада, стрелками на экране и клавиатуре. Клик по боковой карте
 * подводит её в центр, по центральной — тянет карту: она «улетает» в следующий
 * слот (FLIP через Web Animations API) и переворачивается лицом. Вытянутые карты
 * исчезают из колоды. После выбора всех карт колода остаётся, но неактивна.
 * prefers-reduced-motion — без анимаций.
 */
export function CardChoice({ spread, selectedCards, onDraw }: CardChoiceProps): ReactElement {
  const { t } = useTranslation();
  const cardsCount = spread.cardsCount;
  const isComplete = selectedCards.length >= cardsCount;

  const hasReversed = useAppSelector((state) => state.settings.settings.spread?.hasReversed ?? true);
  const deckStyle = useAppSelector((state) => state.settings.settings.appearance?.deckStyle ?? DECK_STYLE_FLAT);
  const backImage = getImage(['core', 'cardBack']);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const busyRef = useRef(false);
  const dragRef = useRef<{ startX: number; startPos: number; moved: boolean; pointerId: number } | null>(null);
  const wheelSnapTimer = useRef<number | undefined>(undefined);

  // Колода — список стабильных id карт-рубашек. Вытянутая карта удаляется из списка,
  // соседи плавно сдвигаются и закрывают место: колода всегда непрерывна.
  const [deck, setDeck] = useState<number[]>(() => Array.from({ length: DECK_SIZE }, (_, i) => i));
  const [pos, setPos] = useState((DECK_SIZE - 1) / 2);
  const [dragging, setDragging] = useState(false);
  const [cardWidth, setCardWidth] = useState(96);
  const [justFilled, setJustFilled] = useState<number | null>(null);

  const selectedIdsMap = useMemo(
    () => Object.fromEntries(selectedCards.map((card) => [card.id, true])),
    [selectedCards],
  );

  const positionLabels = useMemo(
    () =>
      Array.from({ length: cardsCount }, (_, index) => {
        const meaning = spread.cardsOrder?.[index]?.meaning;
        return meaning ? t(`spread:${meaning}`) : '';
      }),
    [cardsCount, spread.cardsOrder, t],
  );

  // Ширина карты колоды задаётся в CSS (var по брейкпоинтам) — меряем, чтобы считать шаг.
  useEffect(() => {
    const measure = () => {
      const el = Object.values(cardRefs.current).find(Boolean);
      if (el) setCardWidth(el.offsetWidth || 96);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const lastIndex = deck.length - 1;
  const activeIndex = clamp(Math.round(pos), 0, Math.max(0, lastIndex));

  const goTo = useCallback((index: number) => setPos(clamp(index, 0, Math.max(0, deck.length - 1))), [deck.length]);

  const step = useCallback((direction: 1 | -1) => goTo(activeIndex + direction), [activeIndex, goTo]);

  const draw = useCallback(
    (deckIndex: number) => {
      if (busyRef.current || isComplete) return;
      const cardKey = deck[deckIndex];
      const deckEl = cardRefs.current[cardKey];
      const slotIndex = selectedCards.length;
      const targetEl = slotRefs.current[slotIndex];

      const card = pickRandomCard(selectedIdsMap);
      const reading = getTarotCardReadings({
        card,
        spreadId: spread.id as SpreadName,
        index: slotIndex,
        direction: hasReversed ? undefined : TarotCardDirection.Upright,
      });

      const commit = () => {
        setDeck((prev) => prev.filter((key) => key !== cardKey));
        // На место вытянутой встаёт соседняя карта — индекс остаётся тем же.
        setPos(clamp(deckIndex, 0, Math.max(0, deck.length - 2)));
        setJustFilled(slotIndex);
        onDraw(reading);
      };

      if (prefersReducedMotion() || !deckEl || !targetEl || typeof document === 'undefined') {
        commit();
        return;
      }

      busyRef.current = true;
      const startRect = deckEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const flyer = document.createElement('div');
      flyer.className = styles.flyer;
      Object.assign(flyer.style, {
        left: `${startRect.left}px`,
        top: `${startRect.top}px`,
        width: `${startRect.width}px`,
        height: `${startRect.height}px`,
      });
      const img = document.createElement('img');
      img.src = backImage;
      img.alt = '';
      img.className = styles.flyerImage;
      flyer.appendChild(img);
      document.body.appendChild(flyer);
      deckEl.style.visibility = 'hidden';

      const dx = targetRect.left - startRect.left;
      const dy = targetRect.top - startRect.top;
      const scale = targetRect.width / startRect.width;
      const faceImage = getImage(['tarotCards', deckStyle, `card${reading.id}`]) || backImage;
      const reversed = reading.direction === TarotCardDirection.Reversed;

      window.setTimeout(() => {
        img.src = faceImage;
        if (reversed) img.style.transform = 'rotate(180deg)';
      }, FLIGHT_DURATION / 2);

      const animation = flyer.animate(
        [
          { transform: 'translate(0, 0) scale(1) rotateY(0deg)' },
          {
            transform: `translate(${dx / 2}px, ${dy / 2 - 40}px) scale(${(1 + scale) / 2}) rotateY(90deg)`,
            offset: 0.5,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateY(0deg)` },
        ],
        { duration: FLIGHT_DURATION, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );

      animation.onfinish = () => {
        flyer.remove();
        deckEl.style.visibility = '';
        busyRef.current = false;
        commit();
      };
    },
    [backImage, deck, deckStyle, hasReversed, isComplete, onDraw, selectedCards.length, selectedIdsMap, spread.id],
  );

  /* ---- перетаскивание ---- */
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isComplete || event.button !== 0) return;
    dragRef.current = { startX: event.clientX, startPos: pos, moved: false, pointerId: event.pointerId };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > DRAG_CLICK_TOLERANCE) {
      drag.moved = true;
      setDragging(true);
      stageRef.current?.setPointerCapture(drag.pointerId);
    }
    if (drag.moved) {
      setPos(clamp(drag.startPos - dx / (cardWidth * SPACING), -0.4, lastIndex + 0.4));
    }
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) {
      setDragging(false);
      // Снап к ближайшей карте.
      setPos((current) => clamp(Math.round(current), 0, lastIndex));
    }
  };

  const onCardClick = (index: number) => {
    if (dragRef.current?.moved) return;
    if (index === activeIndex) {
      draw(index);
    } else {
      goTo(index);
    }
  };

  /* ---- горизонтальное колесо трекпада (вертикальное оставляем странице) ---- */
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (isComplete) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (!horizontal) return;
    setDragging(true);
    setPos((current) => clamp(current + horizontal / (cardWidth * SPACING), 0, lastIndex));
    window.clearTimeout(wheelSnapTimer.current);
    wheelSnapTimer.current = window.setTimeout(() => {
      setDragging(false);
      setPos((current) => clamp(Math.round(current), 0, lastIndex));
    }, 140);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isComplete) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      draw(activeIndex);
    }
  };

  useEffect(() => () => window.clearTimeout(wheelSnapTimer.current), []);

  const cardStyle = (index: number): CSSProperties => {
    const offset = index - pos;
    const distance = Math.abs(offset);
    const hidden = distance > VISIBLE_RANGE;
    const x = offset * cardWidth * SPACING;
    const rotate = clamp(-offset * TILT_DEG, -60, 60);
    const z = -Math.min(distance, VISIBLE_RANGE) * DEPTH_PX;
    return {
      transform: `translateX(calc(-50% + ${x}px)) translateZ(${z}px) rotateY(${rotate}deg)`,
      opacity: hidden ? 0 : Math.max(0.25, 1 - distance * 0.14),
      zIndex: 100 - Math.round(distance * 2),
      pointerEvents: hidden ? 'none' : undefined,
    };
  };

  return (
    <div className={styles.root}>
      {/* Слоты позиций расклада: подпись позиции под каждым, следующий подсвечен. */}
      <ol
        className={styles.slots}
        aria-label={t('spread:flow.positionsTitle')}
        style={{ '--slots-per-row': Math.min(cardsCount, 6) } as CSSProperties}
      >
        {Array.from({ length: cardsCount }, (_, index) => {
          const card = selectedCards[index];
          const isNext = index === selectedCards.length;
          return (
            <li key={index} className={styles.slotItem}>
              <div
                ref={(el) => {
                  slotRefs.current[index] = el;
                }}
                className={[
                  styles.slot,
                  card ? styles.slotFilled : styles.slotEmpty,
                  isNext ? styles.slotNext : '',
                  justFilled === index ? styles.slotReveal : '',
                ].join(' ')}
              >
                {card ? (
                  <TarotCardFace cardId={card.id} direction={card.direction} />
                ) : (
                  <span className={styles.slotNumber}>{index + 1}</span>
                )}
              </div>
              {positionLabels[index] ? (
                <Text role="micro" tone={isNext ? 'accent' : 'ink100'} className={styles.slotLabel}>
                  {positionLabels[index]}
                </Text>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Счётчик сегментами (DS §11), не точками. */}
      <div className={styles.progress} aria-live="polite">
        <div className={styles.segments} aria-hidden="true">
          {Array.from({ length: cardsCount }, (_, index) => (
            <span key={index} className={index < selectedCards.length ? styles.segmentOn : styles.segment} />
          ))}
        </div>
        <Text role="label" tone="ink100">
          {isComplete
            ? t('spread:flow.completedTitle')
            : `${t('spread:flow.pickHint')} · ${selectedCards.length + 1}/${cardsCount}`}
        </Text>
      </div>

      <div className={[styles.deck, isComplete ? styles.deckDone : ''].join(' ')}>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navPrev}`}
          onClick={() => step(-1)}
          disabled={isComplete || activeIndex <= 0}
          aria-label={t('core:button.prev', { defaultValue: 'Назад' })}
        >
          <ChevronLeftIcon width={22} height={22} />
        </button>

        <div
          ref={stageRef}
          className={[styles.stage, dragging ? styles.stageDragging : ''].join(' ')}
          role="listbox"
          tabIndex={isComplete ? -1 : 0}
          aria-label={t('spread:flow.pickHint')}
          aria-activedescendant={`deck-card-${activeIndex}`}
          aria-disabled={isComplete || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        >
          {deck.map((cardKey, index) => (
            <button
              key={cardKey}
              id={`deck-card-${index}`}
              ref={(el) => {
                cardRefs.current[cardKey] = el;
              }}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              className={[styles.deckCard, index === activeIndex && !isComplete ? styles.deckCardActive : ''].join(' ')}
              style={cardStyle(index)}
              onClick={() => onCardClick(index)}
              aria-label={t('core:choice.tapToChoice')}
            >
              <span className={styles.deckCardInner}>
                <TarotCardFace faceDown />
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.navButton} ${styles.navNext}`}
          onClick={() => step(1)}
          disabled={isComplete || activeIndex >= lastIndex}
          aria-label={t('core:button.next', { defaultValue: 'Вперёд' })}
        >
          <ChevronRightIcon width={22} height={22} />
        </button>
      </div>

      {!isComplete ? (
        <Text role="micro" tone="ink100" className={styles.hint}>
          {t('core:choice.scrollCards')} · {t('core:choice.tapToChoice')}
        </Text>
      ) : null}
    </div>
  );
}
