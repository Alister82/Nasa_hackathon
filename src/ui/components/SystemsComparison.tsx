import React from 'react';
import type { CrewDataset, DailyFlag, SystemId } from '@/contracts/types';

export interface SystemsComparisonProps {
  dataset: CrewDataset;
  flags: Record<SystemId, DailyFlag[]>;
}

const SYSTEM_LABELS: Record<SystemId, string> = {
  vigil: 'Vigil',
  threshold: 'Fixed thresholds',
  zscore: 'Rolling z-score',
};

const SYSTEM_COLORS: Record<SystemId, string> = {
  vigil: 'bg-instrument',
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
    <div className="bg-panel border border-line rounded-sheet p-5 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink mb-1">Who flags first</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          Detection timing and pre-onset flags for this scenario. The ground-truth onset comes
          from the simulator.
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
                    {system.label}
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

      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-soft gap-2 flex-wrap">
          <span>Flag timeline across mission days 1 to {dataset.missionDays}</span>
          {onsetDay !== null && (
            <span className="text-status-urgent font-bold">Known onset: day {onsetDay}</span>
          )}
        </div>

        <div className="relative bg-ceramic rounded-sheet p-3 flex flex-col gap-3">
          {onsetDay !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-status-urgent z-10 pointer-events-none"
              style={{ left: `${positionPercent(onsetDay, dataset.missionDays)}%` }}
              title={`Ground-truth onset: day ${onsetDay}`}
            />
          )}

          {stats.map((system) => (
            <div key={system.systemId} className="flex items-center gap-3">
              <span className="w-28 text-xs font-bold text-ink truncate flex-shrink-0">
                {system.label}
              </span>
              <div className="relative flex-1 h-3 bg-panel rounded border border-line">
                {system.flaggedDays.map((day) => (
                  <span
                    key={day}
                    className={`absolute top-0.5 bottom-0.5 w-1 rounded-sm ${SYSTEM_COLORS[system.systemId]}`}
                    style={{ left: `${positionPercent(day, dataset.missionDays)}%` }}
                    title={`${system.label} flagged on day ${day}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
