import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
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

export function IndicatorChart({
  analysis,
  baseline,
  meta,
  range,
  height = 240,
}: IndicatorChartProps) {
  const points = analysis.points;
  const latestPoint = points[points.length - 1];
  const latestValue = analysis.lastValue ?? latestPoint?.value;

  // Chart data: includes value, expected, and baseline band (baseline ± 1 sigma)
  const chartData = points.map((p) => {
    const baseVal = baseline?.median ?? p.expected;
    const sigma = baseline?.sigma ?? 0;
    return {
      day: p.day,
      value: p.value,
      expected: p.expected,
      baselineBandMin: sigma > 0 ? Number((baseVal - sigma).toFixed(meta.decimals)) : null,
      baselineBandMax: sigma > 0 ? Number((baseVal + sigma).toFixed(meta.decimals)) : null,
    };
  });

  const displayVal =
    latestValue !== null && latestValue !== undefined
      ? `${latestValue} ${meta.unit}`
      : 'No reading';

  return (
    <div className="bg-panel border border-line rounded-sheet p-4 shadow-sm w-full">
      {/* Indicator Header: Title + Big Reading + Reference Range */}
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-ink">{meta.label}</h3>
          <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5">
            <span>Reference: {range.displayText}</span>
            <span className="px-1.5 py-0.2 bg-ceramic text-[10px] rounded border border-line">
              Illustrative reference
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums block">
            {displayVal}
          </span>
          <span className="text-xs text-ink-soft font-medium">Day {latestPoint?.day ?? 120}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height }} className="relative select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              tickLine={false}
              stroke="var(--ink-soft)"
              fontSize={11}
              tickFormatter={(v) => `D${v}`}
            />
            <YAxis
              tickLine={false}
              stroke="var(--ink-soft)"
              fontSize={11}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0]?.payload;
                if (!data) return null;
                return (
                  <div className="bg-panel border border-line p-2 rounded shadow-card text-xs">
                    <p className="font-bold text-ink">Day {data.day}</p>
                    <p className="text-ink">
                      Value: {data.value !== null ? `${data.value} ${meta.unit}` : 'Missing (null)'}
                    </p>
                    <p className="text-instrument">Expected: {data.expected} {meta.unit}</p>
                    {data.baselineBandMin !== null && (
                      <p className="text-ink-soft">
                        Baseline band: {data.baselineBandMin} – {data.baselineBandMax} {meta.unit}
                      </p>
                    )}
                  </div>
                );
              }}
            />

            {/* Baseline Band Area (Area between min and max) */}
            {baseline && baseline.sigma > 0 && (
              <Area
                type="monotone"
                dataKey="baselineBandMax"
                stroke="none"
                fill="var(--line)"
                fillOpacity={0.4}
                isAnimationActive={false}
              />
            )}

            {/* Expected Trajectory Line (dashed instrument blue) */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--instrument)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Observed Value Line (solid ink, connectNulls=false to handle nulls as gaps per prompt) */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--ink)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />

            {/* Change-start marker if onsetDay present */}
            {analysis.onsetDay && (
              <ReferenceLine
                x={analysis.onsetDay}
                stroke={
                  analysis.status === 'flagged'
                    ? 'var(--status-review)'
                    : 'var(--status-watch)'
                }
                strokeDasharray="3 3"
                label={{
                  value: `Onset D${analysis.onsetDay}`,
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

