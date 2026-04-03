import { createContext } from 'react';
import { TLoadingsHookResult } from './useLoadings';

type TLoadingsContext = TLoadingsHookResult;

export const LoadingsContext = createContext<Partial<TLoadingsContext>>({});
