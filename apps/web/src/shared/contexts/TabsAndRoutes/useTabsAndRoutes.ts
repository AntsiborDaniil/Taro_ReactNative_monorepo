import { useState } from 'react';
import { TabRoute } from 'shared/types';

export type TTabsAndRoutesHookResult = {
  selectedTab: TabRoute;
  setSelectedTab: (tab: TabRoute) => void;
};

export function useTabsAndRoutes() {
  const [selectedTab, setSelectedTab] = useState<TabRoute>(TabRoute.MainTab);

  return { selectedTab, setSelectedTab };
}
