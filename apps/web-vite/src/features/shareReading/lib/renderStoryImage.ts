/**
 * Картинка для сторис 1080×1920, рисуется на canvas на клиенте.
 * Шрифты — те, что уже грузит страница (tokens.css): Geologica-ExtraBold / Onest-*.
 */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const BG = '#091519';
const GLOW = '#17333d';
const ACCENT = '#eaa433';
const INK = '#ecedcb';

const FONT_TITLE = "'Geologica-ExtraBold', system-ui, sans-serif";
const FONT_BODY = "'Onest-Medium', system-ui, sans-serif";
const FONT_BOLD = "'Onest-Bold', system-ui, sans-serif";
const FONT_BUTTON = "'Onest-ExtraBold', system-ui, sans-serif";

export type StoryCard = {
  /** URL картинки карты (same-origin ассет). */
  src: string;
  reversed: boolean;
  /** Подпись позиции. */
  label: string;
};

export type StoryImageInput = {
  title: string;
  cards: StoryCard[];
  /** Полный общий разбор — берём 1–2 первых предложения. */
  summary: string;
  /** Вопрос показываем только при включённом тумблере (иначе не передавать). */
  question?: string;
  /** Хэндл бота (`@MindFullTaro_bot`) — единственная подпись внизу. */
  botHandle: string;
  /** Рубашка — если картинка карты не загрузилась. */
  backSrc?: string;
};

/** 1–2 первых предложения, до 220 символов. */
export function storyExcerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?…])\s+/);
  let result = '';
  for (const sentence of sentences.slice(0, 2)) {
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > max) break;
    result = next;
  }
  if (result) return result;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  // letterSpacing есть не везде — просто пропускаем, если не поддерживается.
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  // Не влезло — последняя строка с «…».
  const consumed = lines.join(' ').split(' ').length;
  if (consumed < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.replace(/[\s,;:.-]+$/, '')}…`;
  }
  return lines;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  card: StoryCard,
  x: number,
  y: number,
  w: number,
  h: number,
  angle = 0,
): void {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, -w / 2, -h / 2, w, h, 20);
  ctx.fillStyle = GLOW;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save();
  roundRect(ctx, -w / 2, -h / 2, w, h, 20);
  ctx.clip();
  if (img) {
    if (card.reversed) ctx.rotate(Math.PI);
    // cover: карты 9:16, но на случай другого соотношения вписываем с обрезкой.
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  }
  ctx.restore();
  roundRect(ctx, -w / 2, -h / 2, w, h, 20);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(234,164,51,0.55)';
  ctx.stroke();
  ctx.restore();
}

export async function renderStoryImage(input: StoryImageInput): Promise<Blob> {
  await document.fonts.ready;
  // Шрифты подгружаются лениво — явно просим те, что рисуем.
  await Promise.all(
    [`72px ${FONT_TITLE}`, `40px ${FONT_BODY}`, `34px ${FONT_BOLD}`, `44px ${FONT_BUTTON}`].map((f) =>
      document.fonts.load(f).catch(() => undefined),
    ),
  );

  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  // Фон + радиальный блик.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  const glow = ctx.createRadialGradient(540, 620, 40, 540, 620, 980);
  glow.addColorStop(0, GLOW);
  glow.addColorStop(1, BG);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Бренд.
  ctx.fillStyle = ACCENT;
  ctx.font = `34px ${FONT_BOLD}`;
  setSpacing(ctx, 10);
  ctx.fillText('MINDFUL TAROT', STORY_WIDTH / 2 + 5, 150);
  setSpacing(ctx, 0);

  // Карты: 1–3 по ~260px; при >3 — первые 5 веером.
  const fan = input.cards.length > 3;
  const shown = input.cards.slice(0, fan ? 5 : 3);
  const images = await Promise.all(shown.map((c) => loadImage(c.src)));
  const back = images.some((i) => !i) ? await loadImage(input.backSrc ?? '') : null;
  const imgFor = (i: number) => images[i] ?? back;

  let cardsBottom: number;
  if (!fan) {
    const w = 260;
    const h = Math.round((w * 16) / 9);
    const gap = 40;
    const totalW = shown.length * w + (shown.length - 1) * gap;
    const startX = (STORY_WIDTH - totalW) / 2;
    const top = 250;
    shown.forEach((card, i) => {
      drawCard(ctx, imgFor(i), card, startX + i * (w + gap), top, w, h);
    });
    cardsBottom = top + h;
    ctx.fillStyle = 'rgba(236,237,203,0.72)';
    ctx.font = `26px ${FONT_BODY}`;
    shown.forEach((card, i) => {
      if (!card.label) return;
      ctx.fillText(fitText(ctx, card.label, w + gap - 8), startX + i * (w + gap) + w / 2, cardsBottom + 50);
    });
    cardsBottom += 50;
  } else {
    const w = 230;
    const h = Math.round((w * 16) / 9);
    const step = 150;
    const totalW = (shown.length - 1) * step + w;
    const startX = (STORY_WIDTH - totalW) / 2;
    const top = 260;
    shown.forEach((card, i) => {
      const t = shown.length > 1 ? i / (shown.length - 1) - 0.5 : 0;
      const dropY = Math.abs(t) * 50;
      drawCard(ctx, imgFor(i), card, startX + i * step, top + dropY, w, h, t * 0.3);
    });
    cardsBottom = top + h + 50;
  }

  // Название расклада.
  let y = cardsBottom + 110;
  ctx.fillStyle = INK;
  ctx.font = `72px ${FONT_TITLE}`;
  const titleLines = wrapLines(ctx, input.title, 900, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, STORY_WIDTH / 2, y + i * 86));
  y += (titleLines.length - 1) * 86;

  // Разделитель 120px.
  y += 46;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(STORY_WIDTH / 2 - 60, y, 120, 4);
  y += 70;

  // Внизу только хэндл бота — текст может занимать почти всю высоту до safe-зоны сторис.
  const textBottom = 1560;

  // Вопрос — только если передан (тумблер включён).
  if (input.question?.trim()) {
    ctx.fillStyle = ACCENT;
    ctx.font = `34px ${FONT_BOLD}`;
    const q = wrapLines(ctx, `«${input.question.trim()}»`, 860, 2);
    q.forEach((line, i) => ctx.fillText(line, STORY_WIDTH / 2, y + i * 48));
    y += q.length * 48 + 30;
  }

  // Начало общего разбора.
  const excerpt = storyExcerpt(input.summary);
  if (excerpt) {
    ctx.fillStyle = INK;
    ctx.font = `40px ${FONT_BODY}`;
    const lineHeight = 58;
    const maxLines = Math.max(1, Math.min(7, Math.floor((textBottom - y) / lineHeight)));
    const lines = wrapLines(ctx, excerpt, 860, maxLines);
    lines.forEach((line, i) => ctx.fillText(line, STORY_WIDTH / 2, y + i * lineHeight));
  }

  // Хэндл бота над нижней safe-зоной сторис (220px под UI Instagram/Telegram).
  ctx.fillStyle = ACCENT;
  ctx.font = `36px ${FONT_BOLD}`;
  ctx.fillText(input.botHandle, STORY_WIDTH / 2, STORY_HEIGHT - 220);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas_export_failed'))), 'image/png');
  });
}

/**
 * Скачать PNG файлом — и на ноутбуке, и в мобильном браузере (iOS Safari 13+ и
 * Android Chrome понимают <a download> с blob-URL). Web Share API тут не используем:
 * на macOS Chrome он открывал системный лист вместо сохранения файла.
 * В WebView Telegram blob не скачивается вовсе — там вызывающий открывает страницу
 * расклада во внешнем браузере (`/r/<id>?story=1`), см. ShareSheet.
 * TODO: WebApp.shareToStory / downloadFile требуют публичный https-URL картинки —
 * когда появится загрузка в storage, в Mini App использовать их.
 */
export function downloadStoryBlob(blob: Blob, fileName = 'mindful-tarot.png'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
