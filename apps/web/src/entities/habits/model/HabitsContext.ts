import { createContext } from 'react';
import type { THabitsHookResult } from './types';

export const HabitsContext = createContext<Partial<THabitsHookResult>>({});
