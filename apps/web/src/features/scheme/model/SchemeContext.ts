import { createContext } from 'react';
import type { TSchemeCardSize } from 'shared/types';

type TSchemeContextProps = {
  hasRotation?: boolean;
  isChoicePage?: boolean;
  cardSize?: TSchemeCardSize;
  /** 0.5–1: shrink large gaps/margins on narrow screens. */
  gapScale?: number;
};

export const SchemeContext = createContext<Partial<TSchemeContextProps>>({});
