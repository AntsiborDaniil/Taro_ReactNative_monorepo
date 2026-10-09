import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { tarotCards } from './cardsData';

// Эталон: tarotCards до перехода на генерацию ключей (буквальные массивы, ~1,9 МБ исходника).
const snapshot = JSON.parse(
  gunzipSync(readFileSync(path.join(__dirname, '__fixtures__/tarotCards.snapshot.json.gz'))).toString(),
) as Record<string, unknown>;

/** JSON с отсортированными ключами объектов: порядок полей карты не важен, порядок элементов массивов — важен. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

describe('tarotCards: эквивалентность эталонному снимку', () => {
  it('глубоко равен снимку', () => {
    expect(JSON.parse(JSON.stringify(tarotCards))).toEqual(snapshot);
  });

  it('канонические сериализации (ключи отсортированы, порядок массивов сохранён) совпадают', () => {
    expect(canonical(tarotCards)).toBe(canonical(snapshot));
  });
});
