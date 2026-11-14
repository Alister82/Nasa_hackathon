import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type {
  IndicatorAnalysis,
  Baseline,
  IndicatorMeta,
  ReferenceRange,
} from '@/contracts/types';

export interface IndicatorChartProps {
  analysis: IndicatorAnalysis;
  baseline?: Baseline;
  meta: IndicatorMeta;
  range: ReferenceRange;
  height?: number;
}

function withUnit(value: number, meta: IndicatorMeta): string {
  const number = value.toFixed(meta.decimals);
  return meta.unit.startsWith('score') ? number : `${number} ${meta.unit}`;
}

export function IndicatorChart({
  analysis,
  baseline,
  meta,
  range,
  height = 240,
}: IndicatorChartProps) {
  const latestPoint = analysis.points[analysis.points.length - 1];
  const latestValue = analysis.lastValue;

  const chartData = analysis.points.map((point) => ({
    day: point.day,
    value: point.value,
    expected: point.expected,
  }));

  const displayValue =
    latestValue === null ? 'No reading' : withUnit(latestValue, meta);

  return (
    <div className="bg-panel border border-line rounded-sheet p-4 w-full">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-ink">{meta.label}</h3>
          <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5 flex-wrap">
            <span>Reference: {range.displayText}</span>
            <span className="px-1.5 py-0.5 bg-ceramic text-[10px] rounded border border-line">
              Illustrative reference
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums block">
            {displayValue}
          </span>
          <span className="text-xs text-ink-soft font-medium">
            {latestPoint ? `Day ${latestPoint.day}` : ''}
          </span>
        </div>
      </div>

      <div
        style={{ width: '100%', height }}
        className="relative select-none"
        role="img"
        aria-label={`${meta.label} chart: observed values, expected trajectory, and baseline band`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              stroke="var(--ink-soft)"
              fontSize={11}
              tickFormatter={(value) => `D${value}`}
            />
            <YAxis
              tickLine={false}
              stroke="var(--ink-soft)"
              fontSize={11}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload as
                  | { day: number; value: number | null; expected: number }
                  | undefined;
                if (!data) return null;
                return (
                  <div className="bg-panel border border-line p-2 rounded text-xs">
                    <p className="font-bold text-ink">Day {data.day}</p>
                    <p className="text-ink">
                      Value: {data.value === null ? 'Missing' : withUnit(data.value, meta)}
                    </p>
                    <p className="text-instrument">
                      Expected: {withUnit(data.expected, meta)}
                    </p>
                  </div>
                );
              }}
            />

            {baseline && baseline.sigma > 0 && (
              <ReferenceArea
                y1={baseline.median - baseline.sigma}
                y2={baseline.median + baseline.sigma}
                fill="var(--line)"
                fillOpacity={0.4}
                stroke="none"
                ifOverflow="extendDomain"
              />
            )}

            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--instrument)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--ink)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />

            {analysis.onsetDay !== null && (
              <ReferenceLine
                x={analysis.onsetDay}
                stroke={
                  analysis.status === 'flagged'
                    ? 'var(--status-review)'
                    : 'var(--status-watch)'
                }
                strokeDasharray="3 3"
                label={{
                  value: `Change starts D${analysis.onsetDay}`,
                  position: 'insideTopLeft',
                  fill: 'var(--ink-soft)',
                  fontSize: 10,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
