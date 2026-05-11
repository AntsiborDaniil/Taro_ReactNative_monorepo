import React, { type ReactNode } from 'react';
import { View } from 'react-native';

type CartesianChartRenderArgs = {
  points: Record<string, unknown>;
  chartBounds: { bottom: number };
};

export type CartesianChartProps = Record<string, unknown> & {
  children?: (args: CartesianChartRenderArgs) => ReactNode;
};

export function CartesianChart({ children }: CartesianChartProps) {
  return (
    <View>
      {typeof children === 'function'
        ? children({
            points: {},
            chartBounds: { bottom: 0 },
          })
        : children}
    </View>
  );
}

export type LineProps = Record<string, unknown>;

export function Line(_props: LineProps) {
  return null;
}

export type AreaProps = Record<string, unknown> & {
  children?: ReactNode;
};

export function Area({ children }: AreaProps) {
  return <>{children}</>;
}

export function Bar() {
  return null;
}

export const useChartPressState = () => ({ state: {}, isActive: false });

const victoryStub = {};
export default victoryStub;
