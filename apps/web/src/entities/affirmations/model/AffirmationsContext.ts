import { createContext } from 'react';
import { TAffirmationsHookResult } from './useAffirmations';

type TAffirmationsContext = TAffirmationsHookResult;

export const AffirmationsContext = createContext<Partial<TAffirmationsContext>>(
  {}
);
