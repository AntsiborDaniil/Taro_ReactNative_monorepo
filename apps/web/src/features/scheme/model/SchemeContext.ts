import { createContext } from 'react';

type TSchemeContextProps = {
  hasRotation?: boolean;
  isChoicePage?: boolean;
};

export const SchemeContext = createContext<Partial<TSchemeContextProps>>({});
