import { SpreadName } from '@legacy-data';

/**
 * Данные позиций карт (пункт 5) — перенос ФОРМЫ раскладки из 10 файлов
 * apps/web/src/features/scheme/ui/*.tsx (каждый — вручную собранная RN-сетка
 * из TarotSchemeCard), без копирования их RN-разметки: здесь та же
 * геометрия (номер позиции = индекс в selectedCards/cardsOrder, 0-based)
 * записана как компактные блоки row/columns, которые рендерит один общий
 * компонент (SpreadScheme.tsx) через CSS flex.
 *
 * - { cells } — горизонтальный ряд пронумерованных ячеек.
 * - { columns } — несколько вертикальных «стопок» рядов бок о бок (сами
 *   стопки — массив SchemeBlock, т.е. могут содержать несколько рядов).
 *
 * Раскладов без записи тут (не входили и в старый SchemeMapping) — просто
 * нет визуальной схемы, остаётся текстовый список позиций на /spreads/:id.
 */
export type SchemeRow = { cells: number[] };
export type SchemeColumns = { columns: SchemeBlock[][] };
export type SchemeBlock = SchemeRow | SchemeColumns;

export const SPREAD_SCHEME_LAYOUTS: Partial<Record<SpreadName, SchemeBlock[]>> = {
  [SpreadName.Thematic_Relationship]: [{ cells: [4, 5] }, { cells: [2, 3] }, { cells: [0, 1] }],
  [SpreadName.Thematic_Love]: [{ cells: [1] }, { cells: [2, 0, 3] }, { cells: [4, 5] }],
  [SpreadName.Thematic_CareerFinance]: [
    { cells: [0, 8, 3] },
    { cells: [1, 2] },
    { cells: [4, 5] },
    { cells: [6, 7] },
  ],
  [SpreadName.Universal_CelticCross]: [
    { cells: [3] },
    { cells: [4, 0, 1, 5] },
    { cells: [2] },
    { columns: [[{ cells: [9] }, { cells: [8] }, { cells: [7] }, { cells: [6] }]] },
  ],
  [SpreadName.Universal_Pyramid]: [
    { cells: [0] },
    { cells: [1, 2] },
    { cells: [3, 4, 5] },
    { cells: [6, 7, 8, 9] },
  ],
  [SpreadName.Universal_Horseshoe]: [{ cells: [0, 6] }, { cells: [1, 5] }, { cells: [2, 3, 4] }],
  [SpreadName.Choice_Crossroad]: [
    { cells: [5, 6] },
    { cells: [1, 2] },
    { cells: [0] },
    { cells: [3, 4] },
    { cells: [7, 8] },
  ],
  [SpreadName.Choice_TwoPaths]: [
    { columns: [[{ cells: [6] }], [{ cells: [0, 2, 4] }, { cells: [1, 3, 5] }]] },
  ],
  [SpreadName.SelfDevelopment_Mirror]: [
    {
      columns: [
        [{ cells: [2] }, { cells: [1] }, { cells: [0] }],
        [{ cells: [9] }, { cells: [8] }],
        [{ cells: [5] }, { cells: [4] }, { cells: [3] }],
      ],
    },
    { cells: [7, 6] },
  ],
  [SpreadName.SelfDevelopment_ShadowSide]: [{ cells: [0, 1] }, { cells: [2] }, { cells: [3, 4] }],
};
