import { createContext } from 'react';
import { TModalsHookResult } from './useModals';

type TModalsContext = TModalsHookResult;

export const ModalsContext = createContext<Partial<TModalsContext>>({});
