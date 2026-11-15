import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface CheckInTrendPoint {
  day: number;
  mood?: number;
  stress?: number;
  energy?: number;
  sleep?: number;
}

export interface CheckInTrendProps {
  data: CheckInTrendPoint[];
}

const RATING_SERIES = [
  { id: 'mood', label: 'Mood', color: 'var(--instrument)' },
  { id: 'stress', label: 'Stress', color: 'var(--status-review)' },
  { id: 'energy', label: 'Energy', color: 'var(--status-ok)' },
] as const;

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number | string }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/90 bg-white/97 px-3 py-2 shadow-float backdrop-blur">
      <p className="mb-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
        Mission day {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => {
          const series = RATING_SERIES.find((candidate) => candidate.id === entry.dataKey);
          if (!series || entry.value === null || entry.value === undefined) return null;
          return (
            <li key={String(entry.dataKey)} className="flex items-center gap-2 text-[0.68rem]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} aria-hidden="true" />
              <span className="font-medium text-ink-soft">{series.label}</span>
              <span className="ml-auto font-bold tabular-nums text-ink">{entry.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Two stacked charts sharing the same day axis: check-in ratings and sleep hours. */
export function CheckInTrend({ data }: CheckInTrendProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[0.72rem] font-bold text-ink">Check-in ratings (1 to 5)</span>
          {RATING_SERIES.map((series) => (
            <span key={series.id} className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-ink-soft">
              <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: series.color }} aria-hidden="true" />
              {series.label}
            </span>
          ))}
        </div>
        <div
          className="h-36 w-full"
          role="img"
          aria-label="Mood, stress, and energy ratings over the last 30 mission days"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--line)' }}
                tickFormatter={(value: number) => `D${value}`}
                minTickGap={24}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 3, 5]}
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--instrument)', strokeDasharray: '3 3', opacity: 0.4 }} />
              {RATING_SERIES.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, stroke: '#fff', strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <span className="text-[0.72rem] font-bold text-ink">Sleep (hours)</span>
        <div
          className="mt-1 h-32 w-full"
          role="img"
          aria-label="Sleep hours over the last 30 mission days"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--line)' }}
                tickFormatter={(value: number) => `D${value}`}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 12]}
                ticks={[0, 6, 12]}
                tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--instrument)', strokeDasharray: '3 3', opacity: 0.4 }} />
              <Line
                type="monotone"
                dataKey="sleep"
                name="Sleep"
                stroke="var(--ink)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3.5, stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
