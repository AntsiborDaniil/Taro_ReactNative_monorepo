/** Планшетный диапазон: заголовки плиток «Избранное» / «История раскладов». */
export const LIBRARY_TILE_TITLE_MID_MIN = 768;
export const LIBRARY_TILE_TITLE_MID_MAX = 1124;

export function isLibraryTileTitleMidViewport(width: number): boolean {
  return (
    width >= LIBRARY_TILE_TITLE_MID_MIN && width < LIBRARY_TILE_TITLE_MID_MAX
  );
}
