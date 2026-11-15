import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock3, ShieldAlert, Target } from 'lucide-react';
import type { ScenarioResult, SystemId } from '@/contracts/types';
import { SCENARIO_LABELS } from '@/contracts/constants';

export interface ProofChartProps {
  scenario: ScenarioResult;
  labels: Record<SystemId, string>;
}

const SYSTEM_COLORS: Record<SystemId, string> = {
  vigil: 'var(--instrument)',
  threshold: 'var(--status-watch)',
  zscore: 'var(--status-review)',
};

const SYSTEMS: SystemId[] = ['vigil', 'threshold', 'zscore'];

function MetricTooltip({
  active,
  payload,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { name?: string; color?: string }; value?: number | string }>;
  suffix: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry) return null;
  return (
    <div className="rounded-xl border border-white/90 bg-white/97 px-3 py-2 shadow-float backdrop-blur">
      <p className="text-[0.62rem] font-bold text-ink">{entry.payload?.name}</p>
      <p className="mt-0.5 text-[0.7rem] font-semibold tabular-nums text-ink-soft">
        {entry.value} {suffix}
      </p>
    </div>
  );
}

export function ProofChart({ scenario, labels }: ProofChartProps) {
  const delayData = SYSTEMS.map((systemId) => {
    const metrics = scenario.systems[systemId];
    return {
      systemId,
      name: labels[systemId],
      medianDelay: metrics?.medianDelayDays ?? 0,
      detected: metrics ? `${metrics.detectedCount}/${metrics.eventCount}` : '-',
      color: SYSTEM_COLORS[systemId],
    };
  });

  const falseAlarmData = SYSTEMS.map((systemId) => {
    const metrics = scenario.systems[systemId];
    return {
      systemId,
      name: labels[systemId],
      rate: metrics?.falseAlarmsPer100Days ?? 0,
      episodes: metrics?.falseEpisodes ?? 0,
      color: SYSTEM_COLORS[systemId],
    };
  });

  return (
    <article className="panel overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 bg-surface2/45 px-4 py-3">
        <div>
          <p className="section-kicker">Scenario</p>
          <h2 className="font-display text-[1.02rem] font-extrabold tracking-[-0.03em] text-ink">
            {SCENARIO_LABELS[scenario.scenarioId] ?? scenario.scenarioId}
          </h2>
        </div>
        <span className="chip chip-neutral tabular-nums">{scenario.seedCount} simulated crews</span>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-bold text-ink-soft">
            <Clock3 className="h-3.5 w-3.5 text-instrument" aria-hidden="true" />
            Median detection delay (days from onset)
          </span>
          <div className="h-44 w-full" role="img" aria-label={`${SCENARIO_LABELS[scenario.scenarioId]} median detection delay by system`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--line)' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip cursor={{ fill: 'rgba(40,105,216,0.05)' }} content={<MetricTooltip suffix="days" />} />
                <Bar dataKey="medianDelay" radius={[6, 6, 0, 0]} maxBarSize={54}>
                  {delayData.map((entry) => (
                    <Cell key={entry.systemId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-bold text-ink-soft">
            <ShieldAlert className="h-3.5 w-3.5 text-status-review" aria-hidden="true" />
            False alarms per 100 days
          </span>
          <div className="h-44 w-full" role="img" aria-label={`${SCENARIO_LABELS[scenario.scenarioId]} false alarms per 100 days by system`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={falseAlarmData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--line)' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: 'var(--ink-faint)', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip cursor={{ fill: 'rgba(40,105,216,0.05)' }} content={<MetricTooltip suffix="per 100 days" />} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={54}>
                  {falseAlarmData.map((entry) => (
                    <Cell key={entry.systemId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-line/80">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col" className="text-center">Detected / total</th>
              <th scope="col" className="text-center">Median delay (days)</th>
              <th scope="col" className="text-center">False episodes</th>
              <th scope="col" className="text-center">False alarms / 100 days</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {SYSTEMS.map((systemId) => {
              const metrics = scenario.systems[systemId];
              return (
                <tr key={systemId}>
                  <td>
                    <span className="inline-flex items-center gap-2 font-semibold text-ink">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: SYSTEM_COLORS[systemId] }}
                        aria-hidden="true"
                      />
                      {labels[systemId]}
                    </span>
                  </td>
                  <td className="text-center">
                    {metrics ? `${metrics.detectedCount} / ${metrics.eventCount}` : '-'}
                  </td>
                  <td className="text-center">
                    {metrics?.medianDelayDays !== null && metrics?.medianDelayDays !== undefined
                      ? `${metrics.medianDelayDays}`
                      : 'Not detected'}
                  </td>
                  <td className="text-center">{metrics?.falseEpisodes ?? '-'}</td>
                  <td className="text-center">
                    {metrics ? metrics.falseAlarmsPer100Days.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/80 bg-surface2/40 px-4 py-2.5 text-[0.6rem] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Target className="h-3 w-3 text-instrument" aria-hidden="true" />
          Detection delay is measured from the simulated onset.
        </span>
        <span>A lower delay is not automatically better when false alarms rise.</span>
      </footer>
    </article>
  );
}
