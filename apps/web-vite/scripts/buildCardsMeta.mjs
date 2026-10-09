/**
 * Генерирует src/shared/legacy/spreadsAndCards/cardsMeta.ts — компактную таблицу
 * «сколько ключей i18n у карты» вместо ~1,9 МБ буквальных строк 'card:0.meaning.upright.x.3'.
 * Источник — эталонный снимок tarotCards (gz-JSON в __fixtures__), он же — основа
 * теста эквивалентности cardsData.equivalence.test.ts.
 * Запуск: node scripts/buildCardsMeta.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '../src/shared/legacy/spreadsAndCards');
const cards = JSON.parse(
  gunzipSync(readFileSync(path.join(dir, '__fixtures__/tarotCards.snapshot.json.gz'))).toString()
);

/**
 * Исключения: в исходных данных есть ключи, не совпадающие с шаблоном
 * (напр. у карты 5 — 'card:2.…', у карт 26+ flame.10/11 → 'card:25.…').
 * Сохраняем их дословно: id → { 'meaning.upright.x.10': 'card:25…' }.
 */
const overrides = {};

/** 'card:7.meaning.upright.x.3' → число ключей; нестандартные ключи уходят в overrides. */
function countKeys(id, prefix, arr) {
  arr.forEach((key, i) => {
    if (key !== `card:${id}.${prefix}.${i}`) {
      (overrides[id] ??= {})[`${prefix}.${i}`] = key;
    }
  });
  return arr.length;
}

/** field → { dir → { spread → n } } либо { dir → n } для description. */
function shapeOf(id, field, value) {
  const shape = {};
  for (const [direction, inner] of Object.entries(value)) {
    if (Array.isArray(inner)) {
      shape[direction] = countKeys(id, `${field}.${direction}`, inner);
    } else {
      shape[direction] = {};
      for (const [spread, arr] of Object.entries(inner)) {
        shape[direction][spread] = countKeys(id, `${field}.${direction}.${spread}`, arr);
      }
    }
  }
  return shape;
}

const FIELDS = ['meaning', 'advice', 'keywords', 'description'];
const shapes = Object.fromEntries(FIELDS.map((f) => [f, []]));
const shapeIndex = Object.fromEntries(FIELDS.map((f) => [f, new Map()]));
const base = [];

for (const [id, card] of Object.entries(cards)) {
  const shapeIdx = {};
  for (const field of FIELDS) {
    const shape = shapeOf(id, field, card[field]);
    const sig = JSON.stringify(shape);
    if (!shapeIndex[field].has(sig)) {
      shapeIndex[field].set(sig, shapes[field].length);
      shapes[field].push(shape);
    }
    shapeIdx[field] = shapeIndex[field].get(sig);
  }
  const { meaning, advice, keywords, description, ...rest } = card;
  base.push([rest, [shapeIdx.meaning, shapeIdx.advice, shapeIdx.keywords, shapeIdx.description]]);
}

const out = `/* eslint-disable */
// АВТОГЕНЕРАЦИЯ: node scripts/buildCardsMeta.mjs — не править руками.
// Таблица чисел ключей i18n карт и их скалярных полей; строки ключей строит cardsData.ts.

/** Варианты форм: { направление → { расклад → число ключей } } (description: { направление → число }). */
export const CARD_SHAPES = ${JSON.stringify(shapes)} as const;

/** Скалярные поля карты + индексы форм [meaning, advice, keywords, description]. */
/** Дословные исключения из шаблона ключей (см. buildCardsMeta.mjs). */
export const KEY_OVERRIDES: Readonly<Record<string, Readonly<Record<string, string>>>> = ${JSON.stringify(overrides)};

export const CARDS_BASE: ReadonlyArray<readonly [Record<string, unknown>, readonly number[]]> = ${JSON.stringify(base)};
`;
writeFileSync(path.join(dir, 'cardsMeta.ts'), out);
console.log(
  'shapes:',
  Object.fromEntries(FIELDS.map((f) => [f, shapes[f].length])),
  'size:',
  out.length
);
