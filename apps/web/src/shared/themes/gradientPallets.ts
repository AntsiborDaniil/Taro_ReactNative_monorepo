export type TGradientPallet = {
  id: number;
  colors: [string, string];
  texts: {
    colored: string;
    base: string;
  };
};

export const gradientPallets: TGradientPallet[] = [
  // Исходные градиенты
  {
    id: 1,
    colors: ['#667eea', '#764ba2'],
    texts: { colored: '#ffcccb', base: '#FFFFFF' },
  }, // Сине-фиолетовый
  {
    id: 2,
    colors: ['#f093fb', '#f5576c'],
    texts: { colored: '#40c4ff', base: '#000000' },
  }, // Розово-красный
  {
    id: 3,
    colors: ['#4facfe', '#00f2fe'],
    texts: { colored: '#ff4081', base: '#000000' },
  }, // Голубой
  {
    id: 4,
    colors: ['#43e97b', '#38f9d7'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Зеленый
  {
    id: 5,
    colors: ['#fa709a', '#fee140'],
    texts: { colored: '#0288d1', base: '#000000' },
  }, // Розово-желтый
  {
    id: 6,
    colors: ['#a8edea', '#fed6e3'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Светло-голубой/розовый
  {
    id: 7,
    colors: ['#d299c2', '#fef9d7'],
    texts: { colored: '#0288d1', base: '#000000' },
  }, // Розово-бежевый
  {
    id: 8,
    colors: ['#89f7fe', '#66a6ff'],
    texts: { colored: '#f06292', base: '#000000' },
  }, // Голубой

  // Новые спокойные, медитативные градиенты
  {
    id: 9,
    colors: ['#b3cde0', '#6497b1'],
    texts: { colored: '#ff8a65', base: '#000000' },
  }, // Мягкий голубой (море)
  {
    id: 10,
    colors: ['#c7e9b4', '#7bcdba'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Пастельный зеленый
  {
    id: 11,
    colors: ['#f4e1d2', '#f7cac9'],
    texts: { colored: '#0288d1', base: '#000000' },
  }, // Персиковый/розовый
  {
    id: 12,
    colors: ['#d4a5a5', '#f9dede'],
    texts: { colored: '#00695c', base: '#000000' },
  }, // Теплый розовый
  {
    id: 13,
    colors: ['#b2dfdb', '#80cbc4'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Мятный
  {
    id: 14,
    colors: ['#bbdefb', '#90caf9'],
    texts: { colored: '#f06292', base: '#000000' },
  }, // Небесно-голубой
  {
    id: 15,
    colors: ['#c8e6c9', '#a5d6a7'],
    texts: { colored: '#c2185b', base: '#000000' },
  }, // Лесной зеленый
  {
    id: 16,
    colors: ['#fff3e0', '#ffccbc'],
    texts: { colored: '#0277bd', base: '#000000' },
  }, // Теплый персиковый
  {
    id: 17,
    colors: ['#e1bee7', '#ce93d8'],
    texts: { colored: '#388e3c', base: '#000000' },
  }, // Лавандовый
  {
    id: 18,
    colors: ['#b0bec5', '#90a4ae'],
    texts: { colored: '#ff8a65', base: '#000000' },
  }, // Серо-голубой
  {
    id: 19,
    colors: ['#f0f4c3', '#dce775'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Мягкий желто-зеленый
  {
    id: 20,
    colors: ['#b2ebf2', '#80deea'],
    texts: { colored: '#f06292', base: '#000000' },
  }, // Бирюзовый
  {
    id: 21,
    colors: ['#d7ccc8', '#bcaaa4'],
    texts: { colored: '#0288d1', base: '#000000' },
  }, // Кофейный
  {
    id: 22,
    colors: ['#e6ee9c', '#d4e157'],
    texts: { colored: '#c2185b', base: '#000000' },
  }, // Лаймовый
  {
    id: 23,
    colors: ['#b3e5fc', '#81d4fa'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Светло-голубой
  {
    id: 24,
    colors: ['#ffcccb', '#f8bbd0'],
    texts: { colored: '#00695c', base: '#000000' },
  }, // Нежно-розовый
  {
    id: 25,
    colors: ['#c5cae9', '#9fa8da'],
    texts: { colored: '#ff8a65', base: '#000000' },
  }, // Сиреневый
  {
    id: 26,
    colors: ['#a3e1dc', '#80cbc4'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Мятно-голубой
  {
    id: 27,
    colors: ['#f5f5f5', '#e0e0e0'],
    texts: { colored: '#d81b60', base: '#000000' },
  }, // Серый минимализм
  {
    id: 28,
    colors: ['#dcedc8', '#c5e1a5'],
    texts: { colored: '#c2185b', base: '#000000' },
  }, // Светло-зеленый
  {
    id: 29,
    colors: ['#ffecb3', '#ffe082'],
    texts: { colored: '#0277bd', base: '#000000' },
  }, // Янтарный
  {
    id: 30,
    colors: ['#b0bec5', '#eceff1'],
    texts: { colored: '#f06292', base: '#000000' },
  }, // Серо-голубой светлый
];
