import React, { useId } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export interface TrendSeriesSpec {
  id: string;
  label: string;
  color: string;
  unit: string;
  decimals: number;
  axis?: 'left' | 'right';
  area?: boolean;
}

export interface TrendChartPoint {
  day: number;
  [key: string]: number | null;
}

export interface TrendChartProps {
  data: TrendChartPoint[];
  series: TrendSeriesSpec[];
  height?: number;
  ariaLabel: string;
  baseline?: { value: number; label: string } | null;
  showXAxis?: boolean;
  compact?: boolean;
}

function formatAxis(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  name?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  series: TrendSeriesSpec[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/90 bg-white/97 px-3 py-2 shadow-float backdrop-blur">
      <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
        Mission day {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => {
          const spec = series.find((candidate) => candidate.id === entry.dataKey);
          if (!spec || entry.value === null || entry.value === undefined) return null;
          const numeric = Number(entry.value);
          return (
            <li key={String(entry.dataKey)} className="flex items-center gap-2 text-[0.7rem]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: spec.color }}
                aria-hidden="true"
              />
              <span className="font-medium text-ink-soft">{spec.label}</span>
              <span className="ml-auto font-bold tabular-nums text-ink">
                {Number.isFinite(numeric) ? numeric.toFixed(spec.decimals) : '—'}
                {spec.unit.startsWith('score') ? '' : ` ${spec.unit}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Multi-series mission trend chart. Renders only values supplied by the engine. */
export function TrendChart({
  data,
  series,
  height = 250,
  ariaLabel,
  baseline = null,
  showXAxis = true,
  compact = false,
}: TrendChartProps) {
  const rawId = useId().replace(/:/g, '');
  const leftSeries = series.filter((spec) => (spec.axis ?? 'left') === 'left');
  const rightSeries = series.filter((spec) => spec.axis === 'right');

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: rightSeries.length > 0 ? 4 : 8, bottom: 0, left: -18 }}>
            <defs>
              {series.map((spec) => (
                <linearGradient key={spec.id} id={`${rawId}-${spec.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={spec.color} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={spec.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="day"
              hide={!showXAxis}
              tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              minTickGap={compact ? 40 : 28}
              tickFormatter={(value: number) => `D${value}`}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) =>
                formatAxis(value, leftSeries[0]?.decimals ?? 0)
              }
            />
            {rightSeries.length > 0 && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={38}
                domain={['auto', 'auto']}
                tickFormatter={(value: number) =>
                  formatAxis(value, rightSeries[0]?.decimals ?? 0)
                }
              />
            )}
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: 'var(--instrument)', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
            />
            {baseline && (
              <ReferenceLine
                y={baseline.value}
                yAxisId="left"
                stroke="var(--ink-faint)"
                strokeDasharray="4 4"
                strokeOpacity={0.55}
                label={{
                  value: baseline.label,
                  position: 'insideTopRight',
                  fill: 'var(--ink-faint)',
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
            )}
            {series.map((spec) => {
              const axis = spec.axis ?? 'left';
              if (spec.area) {
                return (
                  <Area
                    key={spec.id}
                    yAxisId={axis}
                    type="monotone"
                    dataKey={spec.id}
                    name={spec.label}
                    stroke={spec.color}
                    strokeWidth={2}
                    fill={`url(#${rawId}-${spec.id})`}
                    connectNulls
                    dot={false}
                    activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                    isAnimationActive={false}
                  />
                );
              }
              return (
                <Line
                  key={spec.id}
                  yAxisId={axis}
                  type="monotone"
                  dataKey={spec.id}
                  name={spec.label}
                  stroke={spec.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={false}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!compact && (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          {series.map((spec) => (
            <span key={spec.id} className="inline-flex items-center gap-1.5 text-[0.62rem] font-medium text-ink-soft">
              <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: spec.color }} aria-hidden="true" />
              {spec.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
