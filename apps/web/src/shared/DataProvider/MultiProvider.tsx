import React, { ReactElement } from 'react';

const chainAsChildren = (
  children: React.ReactNode,
  component: React.ReactElement
): ReactElement => React.cloneElement(component, {}, children);

export type MultiProviderProps = React.PropsWithChildren<{
  providers: React.ReactElement[];
}>;

const MultiProvider = ({
  children,
  providers,
}: MultiProviderProps): ReactElement => (
  <>{providers.reduceRight(chainAsChildren, children)}</>
);

export default MultiProvider;
