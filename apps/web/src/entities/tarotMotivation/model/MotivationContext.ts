import { createContext } from 'react';
import { TTarotMotivationHookResult } from './useMotivation';

type TTarotMotivationContext = TTarotMotivationHookResult;

export const MotivationContext = createContext<
  Partial<TTarotMotivationContext>
>({});
