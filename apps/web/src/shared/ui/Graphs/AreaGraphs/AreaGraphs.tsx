import { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia';
import { Area, CartesianChart, Line } from 'shared/stubs/victory';
import montserat from '../../../../../assets/fonts/Montserrat-Black.ttf';
import { COLORS } from '../../../themes';

type InputFields<T> = Extract<keyof T, string>;
type NumericalFields<T> = Extract<keyof T, string>;

export type AreaGraphsProps<T> = {
  data: T[];
  xAxisKey: InputFields<T>;
  yAxisKeys: NumericalFields<T>[];
  formatXLabel?: (label: string | number) => string;
  formatYLabel?: (label: T[NumericalFields<T>]) => string;
  showAxis?: boolean;
  showGuides?: boolean;
  design?: Record<
    NumericalFields<T>,
    {
      // цвет передавать без альфа канала
      color: string;
    }
  >;
  domain?: { x?: [number, number]; y?: [number, number] };
};

const COLORS_GRAPHS = {
  red: '#AC2224',
  green: '#50A622',
  blue: '#2658B7',
};

function AreaGraphs<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  yAxisKeys,
  formatXLabel,
  design,
  formatYLabel,
}: AreaGraphsProps<T>): ReactElement {
  const font = useFont(montserat, 12);

  return (
    <>
      <View style={styles.wrapper}>
        <CartesianChart
          axisOptions={{
            font,
            labelColor: { x: COLORS.SpbSky1, y: COLORS.SpbSky1 },
            lineWidth: { grid: { x: 2, y: 0 }, frame: 0 },
            labelOffset: { x: 4, y: 4 },
            lineColor: {
              grid: { x: COLORS.SpbSky3, y: COLORS.SpbSky3 },
              frame: COLORS.SpbSky3,
            },
            formatXLabel,
            formatYLabel,
            tickCount: { x: 5, y: 5 },
          }}
          data={data}
          xKey={xAxisKey}
          padding={0}
          yKeys={yAxisKeys}
          domain={{ y: [0, 11] }}
          domainPadding={{ right: 20 }}
        >
          {({ points, chartBounds }) =>
            yAxisKeys.map((item) => (
              <View key={String(item)}>
                <Line
                  points={points[item]}
                  color={design?.[item].color ?? COLORS_GRAPHS.red}
                  strokeWidth={2}
                  curveType="natural"
                  connectMissingData
                  animate={{ type: 'timing', duration: 300 }}
                />
                <Area
                  points={points[item]}
                  y0={chartBounds.bottom}
                  color={design?.[item].color ?? COLORS_GRAPHS.red}
                  curveType="natural"
                  connectMissingData
                  // opacity={0.5}
                  animate={{ type: 'timing', duration: 300 }}
                >
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 400)}
                    colors={[
                      `${design?.[item].color ?? COLORS_GRAPHS.red}40`,
                      `${design?.[item].color ?? COLORS_GRAPHS.red}00`,
                    ]}
                  />
                </Area>
              </View>
            ))
          }
        </CartesianChart>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: 300,
    padding: 16,
  },
});

export default AreaGraphs;
