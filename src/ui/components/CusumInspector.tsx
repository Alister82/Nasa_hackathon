import React from 'react';
import type { IndicatorId, AnalysisResult } from '@/contracts/types';
import { getIndicator } from '@/contracts/indicators';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

export interface CusumInspectorProps {
  analysis: AnalysisResult;
  indicatorId?: IndicatorId;
  viewDay: number;
}

export function CusumInspector({
  analysis,
  indicatorId = 'heart_rate',
  viewDay,
}: CusumInspectorProps) {
  const meta = getIndicator(indicatorId);
  const ind = analysis.indicators[indicatorId];
  if (!ind) return null;

  // Prepare points up to viewDay
  const chartData = ind.points
    .filter((p) => p.day <= viewDay)
    .map((p, idx) => ({
      day: p.day,
      z: p.z !== null ? Math.round(p.z * 100) / 100 : null,
      cusum: ind.cusumUp !== undefined ? Math.round(ind.cusumUp * 100) / 100 : 0,
    }));

  return (
    <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-primary">
            Mathematical Decision Boundary
          </span>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            CUSUM Accumulator & Persistence Inspector ({meta.label})
          </h3>
        </div>
        <div className="text-xs text-ink-soft">
          Current CUSUM: <strong className="text-ink font-bold tabular-nums">{ind.cusumUp.toFixed(2)}</strong> | Threshold: <strong className="text-accent-primary font-bold">H=8.0</strong>
        </div>
      </div>

      <p className="text-xs text-ink-soft leading-relaxed">
        Vigil tracks cumulative deviation S_t = max(0, S_(t-1) + z_t - 1.25) from pre-flight baseline.
        An alert triggers only when accumulator exceeds H_FLAG = 8.0 and persists for ≥ 5 consecutive days,
        filtering out transient single-day spikes.
      </p>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" stroke="var(--ink-muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--ink-muted)" fontSize={11} domain={[0, 12]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--line)',
                borderRadius: '0.75rem',
                fontSize: '11px',
                color: 'var(--ink)',
              }}
            />
            {/* Watch Reference Line (H=3) */}
            <ReferenceLine
              y={3}
              stroke="var(--status-watch)"
              strokeDasharray="3 3"
              label={{ value: 'Watch H=3', fill: 'var(--status-watch)', fontSize: 10, position: 'right' }}
            />
            {/* Flag Reference Line (H=8) */}
            <ReferenceLine
              y={8}
              stroke="var(--status-urgent)"
              strokeDasharray="3 3"
              label={{ value: 'Flag H=8', fill: 'var(--status-urgent)', fontSize: 10, position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="cusum"
              name="CUSUM Accumulator"
              stroke="var(--accent-primary)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
