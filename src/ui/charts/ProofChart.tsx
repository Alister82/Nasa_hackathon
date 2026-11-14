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

export function ProofChart({ scenario, labels }: ProofChartProps) {
  const systems: SystemId[] = ['vigil', 'threshold', 'zscore'];

  // Prepare delay data for bar chart
  const delayData = systems.map((sysId) => {
    const s = scenario.systems[sysId];
    return {
      sysId,
      name: labels[sysId],
      medianDelay: s?.medianDelayDays ?? 0,
      detected: s ? `${s.detectedCount}/${s.eventCount}` : '—',
      hasDetection: s ? s.detectedCount > 0 : false,
      color: SYSTEM_COLORS[sysId],
    };
  });

  // Prepare false alarm data for second bar chart
  const falseAlarmData = systems.map((sysId) => {
    const s = scenario.systems[sysId];
    return {
      sysId,
      name: labels[sysId],
      rate: s?.falseAlarmsPer100Days ?? 0,
      episodes: s?.falseEpisodes ?? 0,
      color: SYSTEM_COLORS[sysId],
    };
  });

  return (
    <div className="bg-panel border border-line rounded-sheet p-5 shadow-sm flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-ink">
          {SCENARIO_LABELS[scenario.scenarioId] ?? scenario.scenarioId}
        </h2>
        <span className="text-xs text-ink-soft">
          Evaluated across {scenario.seedCount} seeded simulated crews
        </span>
      </div>

      {/* Two Bar Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 1. Median Detection Delay Chart */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            Median detection delay (days from onset)
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--ink-soft)" fontSize={11} />
                <YAxis stroke="var(--ink-soft)" fontSize={11} />
                <Tooltip
                  formatter={(val: number, _name: string, item: any) => [
                    item.payload.hasDetection ? `${val} days` : 'Not detected',
                    'Median delay',
                  ]}
                />
                <Bar dataKey="medianDelay" radius={[4, 4, 0, 0]}>
                  {delayData.map((entry) => (
                    <Cell key={entry.sysId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. False Alarms Chart */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            False alarms per 100 days
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={falseAlarmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--ink-soft)" fontSize={11} />
                <YAxis stroke="var(--ink-soft)" fontSize={11} />
                <Tooltip formatter={(val: number) => [`${val}`, 'False alarms / 100 days']} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {falseAlarmData.map((entry) => (
                    <Cell key={entry.sysId} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Numerical Data Table */}
      <div className="overflow-x-auto pt-2 border-t border-line">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-line text-ink-soft font-bold">
              <th className="py-2 pr-4">System</th>
              <th className="py-2 px-4 text-center">Detected / Total</th>
              <th className="py-2 px-4 text-center">Median delay (days)</th>
              <th className="py-2 px-4 text-center">False episodes</th>
              <th className="py-2 pl-4 text-center">False alarms / 100 days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums font-medium text-ink">
            {systems.map((sysId) => {
              const s = scenario.systems[sysId];
              return (
                <tr key={sysId} className={sysId === 'vigil' ? 'bg-instrument-soft/20 font-bold' : ''}>
                  <td className="py-2.5 pr-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SYSTEM_COLORS[sysId] }} />
                    <span>{labels[sysId]}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {s ? `${s.detectedCount} / ${s.eventCount}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {s?.medianDelayDays !== null && s?.medianDelayDays !== undefined
                      ? `${s.medianDelayDays}`
                      : 'Not detected'}
                  </td>
                  <td className="py-2.5 px-4 text-center">{s?.falseEpisodes ?? '—'}</td>
                  <td className="py-2.5 pl-4 text-center">{s?.falseAlarmsPer100Days ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

