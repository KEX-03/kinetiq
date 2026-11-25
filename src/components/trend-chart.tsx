import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useThemeColors } from './theme';

const SECTIONS = 4;
const Y_LABEL_WIDTH = 44;
const EDGE_SPACING = 10;

type TrendChartProps = {
  /** Main line, oldest first. */
  values: number[];
  /** Optional second line with one value per point (e.g. a moving average). */
  secondaryValues?: number[];
  /** Shown under the chart's left and right edges, e.g. first and last date. */
  startLabel: string;
  endLabel: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
};

/** Rounds a raw step up to 1, 2, 2.5 or 5 × a power of ten so axis labels look tidy. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** Axis range that hugs the data instead of starting at zero, so changes are visible. */
function niceScale(min: number, max: number) {
  const pad = Math.max((max - min) * 0.15, Math.abs(max) * 0.02, 0.5);
  let step = niceStep((max - min + 2 * pad) / SECTIONS);
  let offset = Math.max(0, Math.floor((min - pad) / step) * step);
  while (offset + step * SECTIONS < max) {
    step = niceStep(step * 1.5);
    offset = Math.max(0, Math.floor((min - pad) / step) * step);
  }
  return { offset, step };
}

function formatAxis(value: number): string {
  return String(Number(value.toFixed(1)));
}

export function TrendChart({
  values,
  secondaryValues,
  startLabel,
  endLabel,
  primaryColor,
  secondaryColor,
  height = 180,
}: TrendChartProps) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);

  const all = [...values, ...(secondaryValues ?? [])];
  const { offset, step } = niceScale(Math.min(...all), Math.max(...all));
  // The chart library always starts its axis at 0, so values are shifted down by `offset`
  // and the labels shifted back up.
  const shift = (list: number[]) => list.map((value) => ({ value: value - offset }));

  const chartWidth = Math.max(0, width - Y_LABEL_WIDTH - 12);
  const spacing =
    values.length > 1 ? (chartWidth - 2 * EDGE_SPACING) / (values.length - 1) : chartWidth;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <LineChart
          data={shift(values)}
          data2={secondaryValues ? shift(secondaryValues) : undefined}
          width={chartWidth}
          height={height}
          spacing={spacing}
          initialSpacing={EDGE_SPACING}
          endSpacing={EDGE_SPACING}
          maxValue={step * SECTIONS}
          noOfSections={SECTIONS}
          formatYLabel={(label) => formatAxis(Number(label) + offset)}
          yAxisLabelWidth={Y_LABEL_WIDTH}
          yAxisTextStyle={[styles.axisText, { color: colors.textSecondary }]}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.fill}
          rulesType="solid"
          rulesColor={colors.fill}
          color1={primaryColor ?? colors.tint}
          color2={secondaryColor ?? colors.pr}
          thickness1={secondaryValues ? 1.5 : 3}
          thickness2={3}
          dataPointsColor1={primaryColor ?? colors.tint}
          dataPointsRadius={values.length > 40 ? 0 : 3.5}
          hideDataPoints2
          disableScroll
          isAnimated={false}
        />
      ) : (
        <View style={{ height: height + 30 }} />
      )}
      <View style={[styles.dates, { paddingLeft: Y_LABEL_WIDTH }]}>
        <Text style={[styles.axisText, { color: colors.textSecondary }]}>{startLabel}</Text>
        <Text style={[styles.axisText, { color: colors.textSecondary }]}>{endLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisText: { fontSize: 12 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
});
