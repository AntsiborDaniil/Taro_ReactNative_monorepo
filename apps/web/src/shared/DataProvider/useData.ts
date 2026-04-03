import { useContext } from 'react';
import type { Context } from 'react';
import type { TProviderData } from './types';

type Props<T> = {
  Context: Context<T>;
};

export function useData<T extends TProviderData>({
  Context: ItemContext,
}: Props<T>): T {
  const context = useContext(ItemContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}
