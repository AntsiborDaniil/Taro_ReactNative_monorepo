/**
 * DS запрещает градиенты — «палитры» сведены к плоской заливке (два одинаковых DS-цвета),
 * имена/id сохранены для обратной совместимости вызывающего кода.
 */
import { DS_COLORS } from './ds';

export type TGradientPallet = {
  id: number;
  colors: [string, string];
  texts: {
    colored: string;
    base: string;
  };
};

const FLAT_TEXTS = { colored: DS_COLORS.accent400, base: DS_COLORS.ink50 };

export const gradientPallets: TGradientPallet[] = Array.from(
  { length: 30 },
  (_, i) => ({
    id: i + 1,
    colors: [DS_COLORS.ground700, DS_COLORS.ground700] as [string, string],
    texts: FLAT_TEXTS,
  })
);
