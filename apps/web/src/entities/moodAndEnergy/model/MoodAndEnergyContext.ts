import { createContext } from 'react';
import { TMoodAndEnergyHookResult } from './useMoodAndEnergy';

type TMoodAndEnergyContext = TMoodAndEnergyHookResult;

export const MoodAndEnergyContext = createContext<
  Partial<TMoodAndEnergyContext>
>({});
