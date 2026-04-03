import { createContext } from 'react';
import { TSpreadHookResult } from './useSpread';

type TSpreadContext = TSpreadHookResult;

export const SpreadContext = createContext<Partial<TSpreadContext>>({});
