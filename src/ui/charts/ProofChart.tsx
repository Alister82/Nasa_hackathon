import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
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
    <div className="bg-panel border border-line rounded-sheet p-5 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-ink">
          {SCENARIO_LABELS[scenario.scenarioId] ?? scenario.scenarioId}
        </h2>
        <span className="text-xs text-ink-soft">
          {scenario.seedCount} simulated crews
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-soft">
            Median detection delay (days from onset)
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--ink-soft)" fontSize={11} />
                <YAxis stroke="var(--ink-soft)" fontSize={11} />
                <Tooltip
                  formatter={(value: number | string) => [`${value} days`, 'Median delay']}
                />
                <Bar dataKey="medianDelay" radius={[4, 4, 0, 0]}>
                  {delayData.map((entry) => (
                    <Cell key={entry.systemId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-soft">False alarms per 100 days</span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={falseAlarmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--ink-soft)" fontSize={11} />
                <YAxis stroke="var(--ink-soft)" fontSize={11} />
                <Tooltip
                  formatter={(value: number | string) => [value, 'False alarms / 100 days']}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {falseAlarmData.map((entry) => (
                    <Cell key={entry.systemId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pt-2 border-t border-line">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-line text-ink-soft font-bold">
              <th className="py-2 pr-4">System</th>
              <th className="py-2 px-4 text-center">Detected / total</th>
              <th className="py-2 px-4 text-center">Median delay (days)</th>
              <th className="py-2 px-4 text-center">False episodes</th>
              <th className="py-2 pl-4 text-center">False alarms / 100 days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums font-medium text-ink">
            {SYSTEMS.map((systemId) => {
              const metrics = scenario.systems[systemId];
              return (
                <tr key={systemId}>
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SYSTEM_COLORS[systemId] }}
                        aria-hidden="true"
                      />
                      {labels[systemId]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {metrics ? `${metrics.detectedCount} / ${metrics.eventCount}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {metrics?.medianDelayDays !== null && metrics?.medianDelayDays !== undefined
                      ? `${metrics.medianDelayDays}`
                      : 'Not detected'}
                  </td>
                  <td className="py-2.5 px-4 text-center">{metrics?.falseEpisodes ?? '-'}</td>
                  <td className="py-2.5 pl-4 text-center">
                    {metrics ? metrics.falseAlarmsPer100Days.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
