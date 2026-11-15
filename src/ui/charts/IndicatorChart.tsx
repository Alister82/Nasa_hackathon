import React, { useId } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import type {
  IndicatorAnalysis,
  Baseline,
  IndicatorMeta,
  ReferenceRange,
} from '@/contracts/types';
import { StatusChip, type StatusType } from '@/ui/components/StatusChip';
import { DeltaBadge } from '@/ui/components/ui';
import { IndicatorIcon } from '@/ui/components/MetricTile';

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

function statusType(status: IndicatorAnalysis['status']): StatusType {
  if (status === 'flagged') return 'review';
  return status as StatusType;
}

export function IndicatorChart({
  analysis,
  baseline,
  meta,
  range,
  height = 220,
}: IndicatorChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const latestPoint = analysis.points[analysis.points.length - 1];
  const latestValue = analysis.lastValue;
  const delta =
    latestValue !== null && baseline ? latestValue - baseline.median : null;
  const deltaPercent =
    delta !== null && baseline && baseline.median !== 0
      ? (delta / baseline.median) * 100
      : null;

  const chartData = analysis.points.map((point) => ({
    day: point.day,
    value: point.value,
    expected: point.expected,
  }));

  return (
    <article className="panel overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-instrument-soft text-instrument">
            <IndicatorIcon indicator={meta.id} className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[0.88rem] font-bold tracking-[-0.015em] text-ink">{meta.label}</h3>
            <p className="mt-0.5 text-[0.64rem] text-ink-soft">
              Reference: {range.displayText}
              <span className="ml-1.5 rounded border border-line bg-surface2 px-1 py-0.5 text-[0.54rem] font-semibold uppercase tracking-wide text-ink-faint">
                Illustrative
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="metric-number text-[1.35rem] leading-none">
              {latestValue === null ? '—' : latestValue.toFixed(meta.decimals)}
              {!meta.unit.startsWith('score') && (
                <span className="ml-1 text-[0.62rem] font-semibold text-ink-soft">{meta.unit}</span>
              )}
            </p>
            <p className="mt-0.5 text-[0.6rem] font-medium text-ink-faint">
              {latestPoint ? `Day ${latestPoint.day}` : 'No reading'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusChip status={statusType(analysis.status)} />
            <DeltaBadge
              value={deltaPercent}
              suffix="%"
              inverse={meta.concernDirection === 'down'}
            />
          </div>
        </div>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-[0.6rem] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-ink" aria-hidden="true" /> Observed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-instrument" aria-hidden="true" /> Expected adaptation
        </span>
        {baseline && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-line" aria-hidden="true" /> Pre-flight ±1σ
          </span>
        )}
        {analysis.onsetDay !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-status-review" aria-hidden="true" /> Change starts D{analysis.onsetDay}
          </span>
        )}
      </div>

      <div
        style={{ width: '100%', height }}
        className="relative mt-1 select-none px-1"
        role="img"
        aria-label={`${meta.label} chart: observed values, expected trajectory, and baseline band`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 14, left: -18, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--instrument)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--instrument)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(value: number) => `D${value}`}
              minTickGap={28}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
              domain={['auto', 'auto']}
              width={44}
              tickFormatter={(value: number) => value.toFixed(meta.decimals)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--instrument)', strokeDasharray: '3 3', opacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload as
                  | { day: number; value: number | null; expected: number }
                  | undefined;
                if (!data) return null;
                return (
                  <div className="rounded-xl border border-white/90 bg-white/97 px-3 py-2 text-[0.68rem] shadow-float backdrop-blur">
                    <p className="mb-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
                      Day {data.day}
                    </p>
                    <p className="font-semibold text-ink">
                      Observed: {data.value === null ? 'Missing' : withUnit(data.value, meta)}
                    </p>
                    <p className="mt-0.5 text-instrument">
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
                fillOpacity={0.55}
                stroke="none"
                ifOverflow="extendDomain"
              />
            )}

            {baseline && (
              <ReferenceLine
                y={baseline.median}
                stroke="var(--ink-faint)"
                strokeDasharray="2 4"
                strokeOpacity={0.6}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--ink)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={{ r: 3.5, stroke: '#fff', strokeWidth: 2 }}
            />

            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--instrument)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              strokeOpacity={0.75}
              dot={false}
              isAnimationActive={false}
            />

            {analysis.onsetDay !== null && (
              <ReferenceLine
                x={analysis.onsetDay}
                stroke={analysis.status === 'flagged' ? 'var(--status-review)' : 'var(--status-watch)'}
                strokeDasharray="3 3"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
