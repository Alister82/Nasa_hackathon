import React from 'react';
import type { CrewDataset, DailyFlag, SystemId } from '@/contracts/types';

export interface SystemsComparisonProps {
  dataset: CrewDataset;
  flags: Record<SystemId, DailyFlag[]>;
}

const SYSTEM_LABELS: Record<SystemId, string> = {
  vigil: 'Vigil (Adaptive CUSUM)',
  threshold: 'Fixed thresholds',
  zscore: 'Rolling z-score',
};

const SYSTEM_COLORS: Record<SystemId, string> = {
  vigil: 'bg-accent-primary',
  threshold: 'bg-status-watch',
  zscore: 'bg-status-review',
};

const SYSTEMS: SystemId[] = ['vigil', 'threshold', 'zscore'];

function positionPercent(day: number, missionDays: number): number {
  if (missionDays <= 1) return 0;
  return Math.max(0, Math.min(100, ((day - 1) / (missionDays - 1)) * 100));
}

export function SystemsComparison({ dataset, flags }: SystemsComparisonProps) {
  const onsetDay = dataset.groundTruth[0]?.onsetDay ?? null;

  const stats = SYSTEMS.map((systemId) => {
    const systemFlags = flags[systemId] ?? [];
    const flaggedDays = systemFlags.filter((flag) => flag.flagged).map((flag) => flag.day);
    const firstFlagDay = flaggedDays[0] ?? null;

    let daysAfterOnset = '-';
    if (onsetDay !== null && firstFlagDay !== null) {
      const difference = firstFlagDay - onsetDay;
      daysAfterOnset = difference >= 0 ? `+${difference}` : `${difference}`;
    }

    const flagsBeforeOnset =
      onsetDay !== null ? flaggedDays.filter((day) => day < onsetDay).length : 0;

    return {
      systemId,
      label: SYSTEM_LABELS[systemId],
      firstFlagDay: firstFlagDay !== null ? `Day ${firstFlagDay}` : 'None',
      daysAfterOnset,
      flagsBeforeOnset,
      flaggedDays,
    };
  });

  return (
    <div className="glass-panel border border-line rounded-3xl p-5 sm:p-6 shadow-card flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink mb-1">Who flags first</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          Detection timing and pre-onset false alarms for this scenario. Ground truth onset comes from the mathematical simulator.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-line text-ink-soft font-bold">
              <th className="py-2.5 pr-4">System</th>
              <th className="py-2.5 px-4 text-center">First flag day</th>
              <th className="py-2.5 px-4 text-center">Days after onset</th>
              <th className="py-2.5 pl-4 text-center">Flags before onset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums font-medium text-ink">
            {stats.map((system) => (
              <tr key={system.systemId}>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${SYSTEM_COLORS[system.systemId]}`}
                      aria-hidden="true"
                    />
                    <strong className="font-semibold">{system.label}</strong>
                  </span>
                </td>
                <td className="py-3 px-4 text-center">{system.firstFlagDay}</td>
                <td className="py-3 px-4 text-center">{system.daysAfterOnset}</td>
                <td className="py-3 pl-4 text-center">{system.flagsBeforeOnset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flag Timeline Visualization */}
      <div className="flex flex-col gap-3 pt-3 border-t border-line/70">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-soft gap-2 flex-wrap">
          <span>Flag timeline across mission days 1 to {dataset.missionDays}</span>
          {onsetDay !== null && (
            <span className="text-status-urgent font-bold flex items-center gap-1.5 bg-status-urgent/10 px-2 py-0.5 rounded-md border border-status-urgent/20">
              <span className="w-2 h-2 rounded-full bg-status-urgent" />
              Known ground-truth onset: Day {onsetDay}
            </span>
          )}
        </div>

        <div className="p-4 bg-panel/60 rounded-2xl border border-line/70 flex flex-col gap-3.5">
          {stats.map((system) => (
            <div key={system.systemId} className="flex items-center gap-3">
              <span className="w-36 text-xs font-bold text-ink truncate flex-shrink-0">
                {system.label}
              </span>
              <div className="relative flex-1 h-5 bg-panel-solid rounded-lg border border-line/80 overflow-hidden shadow-inner">
                {/* Onset Guide Marker */}
                {onsetDay !== null && (
                  <span
                    className="absolute top-0 bottom-0 w-0.5 bg-status-urgent z-10 pointer-events-none opacity-85"
                    style={{ left: `${positionPercent(onsetDay, dataset.missionDays)}%` }}
                    title={`Known onset: Day ${onsetDay}`}
                  />
                )}

                {/* Visible Flags */}
                {system.flaggedDays.map((day) => (
                  <span
                    key={day}
                    className={`absolute top-0.5 bottom-0.5 w-1.5 rounded-xs ${SYSTEM_COLORS[system.systemId]} shadow-[0_0_4px_currentColor]`}
                    style={{ left: `${positionPercent(day, dataset.missionDays)}%` }}
                    title={`${system.label} flagged on day ${day}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Timeline Scale Marks */}
          <div className="flex items-center gap-3 pt-1">
            <span className="w-36 flex-shrink-0" />
            <div className="flex-1 flex justify-between text-[10px] text-ink-soft font-semibold tabular-nums px-1">
              <span>Day 1</span>
              <span>Day 45</span>
              <span>Day 90</span>
              <span>Day 135</span>
              <span>Day 180</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
