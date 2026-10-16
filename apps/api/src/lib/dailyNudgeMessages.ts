/**
 * Разнообразные тексты ежедневного сообщения в Telegram (10:00 МСК, дневной ⚡ обновился).
 * Чистые функции, без зависимостей. Plain text — без Markdown-символов.
 *
 * Выбор детерминирован: индекс = (номер дня с эпохи + смещение получателя) mod N.
 * Соседние дни у одного человека всегда разные, полный цикл — N дней без повторов,
 * разные получатели в один день получают разные варианты (смещение из хеша recipientKey).
 */

export type NudgeLang = 'ru' | 'en';

/** Общие тексты, нейтральные к дню недели. */
export const NUDGE_TEXTS_RU: readonly string[] = [
  'Какая карта отзовётся тебе сегодня? Дневной ⚡ обновился — самое время задать свой вопрос.',
  'Доброе утро. Бесплатный расклад на сегодня снова доступен ⚡ Загляни, когда будет минутка тишины.',
  'Карта дня уже ждёт тебя. Дневной ⚡ обновился, можно начинать без спешки.',
  'Что сегодня просит твоего внимания? Бесплатный ⚡ обновился — можно спросить у карт мягко и по-своему.',
  'Маленькая пауза в начале дня может многое прояснить. Твой ⚡ на сегодня снова с тобой.',
  'Новый день, новый вопрос. Дневной ⚡ обновился — выбери, о чём хочется подумать сегодня.',
  'Если хочется на минуту остановиться и заглянуть внутрь, твой бесплатный расклад ждёт. ⚡ уже обновился.',
  'Один вопрос, одна карта, пара спокойных минут. Дневной ⚡ обновился.',
  'Как ты сегодня на самом деле? Карты могут помочь это заметить. Бесплатный ⚡ снова доступен.',
  'Сегодняшний ⚡ уже на месте. Вытянем карту дня и посмотрим, что она подсветит?',
  'Утро — хорошее время спросить себя: чего мне сегодня не хватает? Дневной ⚡ обновился.',
  'Без планов и обещаний — просто карта и немного внимания к себе. ⚡ на сегодня обновился.',
  'На что ты хочешь опереться сегодня? Бесплатный расклад доступен, дневной ⚡ обновился.',
  'Чем бы ты хотел занять сегодняшнюю тишину? Загляни в карту дня — дневной ⚡ уже обновился.',
  'Иногда достаточно одного образа, чтобы мысли встали на места. Твой бесплатный ⚡ снова доступен.',
  'Что хочется отпустить, а что — оставить рядом? Дневной ⚡ обновился, можно спросить об этом у карт.',
  'Сегодня у тебя снова есть бесплатный расклад ⚡ Выбери вопрос, который звучит тише всего, и начни с него.',
  'Тихое напоминание: дневной ⚡ обновился. Карта дня — это просто повод побыть с собой.',
  'Как прошла ночь, с каким настроением ты проснулся? Расклад поможет это назвать. ⚡ уже обновился.',
  'Пусть сегодняшний день начнётся с вопроса, а не со спешки. Бесплатный ⚡ ждёт тебя.',
  'Карты не говорят, что будет, но помогают увидеть, что есть. Дневной ⚡ обновился.',
];

export const NUDGE_TEXTS_EN: readonly string[] = [
  'Which card will speak to you today? Your daily ⚡ has refilled, so it is a good moment to ask your question.',
  'Good morning. Your free reading for today is available again ⚡ Stop by when you have a quiet minute.',
  'Your card of the day is waiting. The daily ⚡ has refilled, and there is no need to rush.',
  'What is asking for your attention today? Your free ⚡ is back. Ask the cards gently, in your own way.',
  'A small pause at the start of the day can bring clarity. Your ⚡ for today is with you again.',
  'A new day, a new question. Your daily ⚡ has refilled, so pick what you would like to reflect on.',
  'If you feel like pausing for a moment and looking inward, your free reading is ready. ⚡ has refilled.',
  'One question, one card, a few calm minutes. Your daily ⚡ has refilled.',
  'How are you, really? The cards can help you notice. Your free ⚡ is available again.',
  'Your ⚡ for today is already here. Shall we draw a card of the day and see what it brings into focus?',
  'Morning is a good time to ask yourself what you need today. Your daily ⚡ has refilled.',
  'No plans, no promises, just a card and a little attention to yourself. Your ⚡ for today has refilled.',
  'What would you like to lean on today? A free reading is available, your daily ⚡ has refilled.',
  'How would you like to spend the quiet of today? Take a look at your card of the day. Your ⚡ has refilled.',
  'Sometimes a single image is enough to settle your thoughts. Your free ⚡ is available again.',
  'What do you want to let go of, and what to keep close? Your daily ⚡ has refilled, so you can ask the cards.',
  'You have a free reading again today ⚡ Pick the quietest question and start there.',
  'A gentle reminder: your daily ⚡ has refilled. The card of the day is simply a reason to be with yourself.',
  'How did you sleep, and what mood did you wake up with? A reading can help you name it. ⚡ has refilled.',
  'Let today begin with a question rather than a rush. Your free ⚡ is waiting for you.',
  'The cards do not tell what will happen, but they help you see what is here. Your daily ⚡ has refilled.',
];

/** Тематические пулы по дню недели (getUTCDay от day): показываются только в свой день. */
export const NUDGE_MONDAY_RU: readonly string[] = [
  'Понедельник можно начать бережно. Дневной ⚡ обновился — спроси карты, как войти в неделю в своём темпе.',
  'Новая неделя начинается тихо. Бесплатный ⚡ обновился — карта дня поможет выбрать, на что опереться.',
  'Не обязательно врываться в понедельник на полной скорости. Дневной ⚡ обновился, расклад ждёт.',
];
export const NUDGE_FRIDAY_RU: readonly string[] = [
  'К пятнице накапливается усталость. Бесплатный ⚡ обновился — карта дня поможет ненадолго выдохнуть.',
  'Пятница: неделя почти позади. Дневной ⚡ обновился — загляни в карту и отметь, что сегодня важно для тебя.',
  'Конец недели — хороший повод замедлиться. Бесплатный ⚡ обновился, расклад ждёт, когда ты будешь готов.',
];
export const NUDGE_SUNDAY_RU: readonly string[] = [
  'В воскресенье хорошо оглянуться на неделю и услышать себя. Дневной ⚡ обновился, расклад ждёт.',
  'Воскресенье — день, чтобы собраться с мыслями перед новой неделей. Бесплатный ⚡ обновился.',
  'Выходной можно провести в тишине с собой. Дневной ⚡ обновился — карта дня готова.',
];
export const NUDGE_MONDAY_EN: readonly string[] = [
  'Monday can begin gently. Your daily ⚡ has refilled, so ask the cards how to ease into the week at your pace.',
  'A new week starts quietly. Your free ⚡ is back, and a card of the day can help you choose what to lean on.',
  'You do not have to rush into Monday at full speed. Your daily ⚡ has refilled, and a reading is waiting.',
];
export const NUDGE_FRIDAY_EN: readonly string[] = [
  'By Friday tiredness builds up. Your free ⚡ is back, and a card of the day can help you exhale for a moment.',
  'Friday: the week is almost behind you. Your daily ⚡ has refilled, so see what matters to you today.',
  'The end of the week is a good reason to slow down. Your free ⚡ has refilled, and a reading is ready when you are.',
];
export const NUDGE_SUNDAY_EN: readonly string[] = [
  'Sunday is a nice time to look back on the week and hear yourself. Your daily ⚡ has refilled.',
  'Sunday is a day to gather your thoughts before a new week. Your free ⚡ has refilled.',
  'A day off can be spent in quiet with yourself. Your daily ⚡ has refilled, and your card of the day is ready.',
];

/** Короткая строка для тех, у кого есть купленные заряды (без давления). */
export const NUDGE_PAID_SUFFIX_RU: readonly string[] = [
  'Твои накопленные заряды тоже на месте.',
  'Купленные заряды никуда не делись, они подождут.',
  'А запас зарядов остаётся с тобой.',
];
export const NUDGE_PAID_SUFFIX_EN: readonly string[] = [
  'Your saved charges are still there too.',
  'Your saved charges are safe and will wait for you.',
  'Your stock of charges stays with you.',
];

export const NUDGE_BUTTONS_RU: readonly string[] = ['🃏 Карта дня', '✨ Открыть расклад', '🌙 Мой ⚡ на сегодня'];
export const NUDGE_BUTTONS_EN: readonly string[] = ['🃏 Card of the day', '✨ Open a reading', '🌙 My ⚡ for today'];

const MS_PER_DAY = 86_400_000;

/** Номер дня с эпохи из 'YYYY-MM-DD' (UTC, без часовых поясов). */
function dayNumber(day: string): number {
  const ms = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.floor(ms / MS_PER_DAY) : 0;
}

/** FNV-1a 32 bit: стабильное смещение получателя. */
function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function pickDailyNudge(params: {
  lang: NudgeLang;
  day: string;
  recipientKey: string;
  hasPaidCredits: boolean;
}): { text: string; buttonLabel: string } {
  const ru = params.lang === 'ru';
  const texts = ru ? NUDGE_TEXTS_RU : NUDGE_TEXTS_EN;
  const buttons = ru ? NUDGE_BUTTONS_RU : NUDGE_BUTTONS_EN;
  const suffixes = ru ? NUDGE_PAID_SUFFIX_RU : NUDGE_PAID_SUFFIX_EN;

  const dn = dayNumber(params.day);
  const offset = hashKey(params.recipientKey);
  const weekday = new Date(dn * MS_PER_DAY).getUTCDay();
  const themed = weekday === 1 ? (ru ? NUDGE_MONDAY_RU : NUDGE_MONDAY_EN)
    : weekday === 5 ? (ru ? NUDGE_FRIDAY_RU : NUDGE_FRIDAY_EN)
    : weekday === 0 ? (ru ? NUDGE_SUNDAY_RU : NUDGE_SUNDAY_EN)
    : null;
  // Пул пн/пт/вс не пересекается с общим, поэтому соседние дни всегда различаются.
  const pool = themed ?? texts;
  let text = pool[mod(dn + offset, pool.length)];
  if (params.hasPaidCredits) {
    text += `\n\n${suffixes[mod(dn + offset, suffixes.length)]}`;
  }
  return { text, buttonLabel: buttons[mod(dn + offset, buttons.length)] };
}
