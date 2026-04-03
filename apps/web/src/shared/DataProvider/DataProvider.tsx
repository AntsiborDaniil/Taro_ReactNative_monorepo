import type { Context, ReactElement, ReactNode } from 'react';
import type { TProviderData } from './types';

type Props<T> = {
  Context: Context<T>;
  children?: ReactNode;
  value: T;
};

function DataProvider<T extends TProviderData>({
  Context: ItemContext,
  children,
  value,
}: Props<T>): ReactElement {
  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}

export default DataProvider;
