import { createContext } from 'react';
import { TTabsAndRoutesHookResult } from './useTabsAndRoutes';

type TTabsAndRoutesContext = TTabsAndRoutesHookResult;

export const TabsAndRoutesContext = createContext<
  Partial<TTabsAndRoutesContext>
>({});
