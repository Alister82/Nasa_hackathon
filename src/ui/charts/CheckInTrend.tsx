import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

/** Two stacked charts sharing the same day axis: check-in ratings and sleep hours. */
export function CheckInTrend({ data }: CheckInTrendProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-3 flex-wrap text-xs text-ink-soft mb-1">
          <span className="font-bold text-ink">Check-in ratings (1 to 5)</span>
          <span>Mood</span>
          <span>Stress</span>
          <span>Energy</span>
        </div>
        <div className="h-36 w-full" role="img" aria-label="Mood, stress, and energy ratings over the last 30 mission days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
              <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
              <Tooltip />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="var(--instrument)" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="stress" name="Stress" stroke="var(--status-review)" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="energy" name="Energy" stroke="var(--status-ok)" strokeWidth={2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <span className="text-xs font-bold text-ink">Sleep (hours)</span>
        <div className="h-32 w-full mt-1" role="img" aria-label="Sleep hours over the last 30 mission days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
              <YAxis domain={[0, 12]} ticks={[0, 6, 12]} tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
              <Tooltip />
              <Line type="monotone" dataKey="sleep" name="Sleep" stroke="var(--ink)" strokeWidth={2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
