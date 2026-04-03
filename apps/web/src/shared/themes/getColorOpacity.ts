export function getColorOpacity(hex: string, opacity: number): string {
  // Убираем # если он есть
  hex = hex.replace('#', '');

  // Преобразуем hex в RGB используя slice
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Opacity должен быть от 0 до 100, преобразуем в 0-1 для rgba
  const alpha = opacity / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
