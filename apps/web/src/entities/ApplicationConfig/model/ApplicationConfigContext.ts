import { createContext } from 'react';
import { TApplicationConfigHookResult } from './useApplicationConfig';

type TApplicationConfigContext = TApplicationConfigHookResult;

export const ApplicationConfigContext = createContext<
  Partial<TApplicationConfigContext>
>({});
