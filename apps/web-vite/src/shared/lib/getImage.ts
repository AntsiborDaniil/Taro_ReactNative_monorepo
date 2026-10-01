/**
 * Резолвер картинок из assets/images (скопированы из apps/web). Старый getImage
 * (apps/web/src/shared/lib/getImage) ходит по карте require() из imageAssets.ts.
 * Здесь тот же принцип на Vite: import.meta.glob по тому же
 * дереву файлов, ключ — путь сегментов ровно как в старом imageAssets (['core','girl'] и т.п.).
 * Форматы смешаны (.webp и пара .png у *BackgroundClear) — паттерн ловит оба.
 */
const modules = import.meta.glob('../../../assets/images/**/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const BASE_PREFIX = '../../../assets/images/';

const index = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  if (!path.startsWith(BASE_PREFIX)) continue;
  const rest = path.slice(BASE_PREFIX.length);
  const withoutExt = rest.replace(/\.[^./]+$/, '');
  index.set(withoutExt, url);
}

/** Тот же контракт, что apps/web/src/shared/lib/getImage: путь сегментов → URL (или '' если нет). */
export function getImage(path: string[]): string {
  return index.get(path.join('/')) ?? '';
}

/** Единственный стиль колоды, для которого есть картинки на перенесённых экранах. */
export const DECK_STYLE_FLAT = 'flatIllustration' as const;
