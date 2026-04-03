import { useState } from 'react';

export type TLoadingsHookResult = {
  isFullScreenLoading: boolean;
  setIsFullScreenLoading: (value: boolean) => void;
};

export function useLoadings() {
  const [isFullScreenLoading, setIsFullScreenLoading] =
    useState<boolean>(false);

  return { isFullScreenLoading, setIsFullScreenLoading };
}
