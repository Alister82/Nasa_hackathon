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

const SYSTEM_COLORS: Record<SystemId, { dot: string; text: string }> = {
  vigil: { dot: 'bg-instrument', text: 'text-instrument' },
  threshold: { dot: 'bg-status-watch', text: 'text-status-watch' },
  zscore: { dot: 'bg-status-review', text: 'text-status-review' },
};

export function SystemsComparison({ dataset, flags }: SystemsComparisonProps) {
  const medicalEvent = dataset.groundTruth.find((e) => e.isMedical);
  const onsetDay = medicalEvent?.onsetDay ?? null;

  const systems: SystemId[] = ['vigil', 'threshold', 'zscore'];

  // Calculate first flag day, days after onset, flags before onset
  const stats = systems.map((sysId) => {
    const sysFlags = flags[sysId] ?? [];
    const flaggedDays = sysFlags.filter((f) => f.flagged).map((f) => f.day);
    const firstFlagDay = flaggedDays.length > 0 ? flaggedDays[0]! : null;

    let daysAfterOnset: number | string = '—';
    if (onsetDay !== null && firstFlagDay !== null) {
      const diff = firstFlagDay - onsetDay;
      daysAfterOnset = diff >= 0 ? `+${diff}` : `${diff}`;
    }

    const flagsBeforeOnset = onsetDay !== null
      ? flaggedDays.filter((d) => d < onsetDay).length
      : 0;

    return {
      sysId,
      label: SYSTEM_LABELS[sysId],
      firstFlagDay: firstFlagDay !== null ? `Day ${firstFlagDay}` : 'None',
      daysAfterOnset,
      flagsBeforeOnset,
      flaggedDays,
    };
  });

  return (
    <div className="bg-panel border border-line rounded-sheet p-5 shadow-sm flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink mb-1">Who flags first</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          Detection timing and false alerts comparison across systems for this scenario.
        </p>
      </div>

      {/* Comparison Table */}
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
            {stats.map((s) => (
              <tr key={s.sysId} className={s.sysId === 'vigil' ? 'bg-instrument-soft/20 font-bold' : ''}>
                <td className="py-3 pr-4 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${SYSTEM_COLORS[s.sysId].dot}`} aria-hidden="true" />
                  <span>{s.label}</span>
                </td>
                <td className="py-3 px-4 text-center">{s.firstFlagDay}</td>
                <td className="py-3 px-4 text-center">{s.daysAfterOnset}</td>
                <td className="py-3 pl-4 text-center">{s.flagsBeforeOnset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shared Timeline visualization */}
      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-soft">
          <span>Flag timeline across mission days (1 to 180)</span>
          {onsetDay && (
            <span className="text-status-urgent font-bold">
              Known onset: Day {onsetDay}
            </span>
          )}
        </div>

        <div className="relative bg-ceramic rounded-sheet p-3 flex flex-col gap-3">
          {onsetDay && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-status-urgent z-10 pointer-events-none"
              style={{ left: `${(onsetDay / 180) * 100}%` }}
              title={`Ground truth onset: Day ${onsetDay}`}
            />
          )}

          {stats.map((s) => (
            <div key={s.sysId} className="flex items-center gap-3">
              <span className="w-28 text-xs font-bold text-ink truncate flex-shrink-0">
                {s.label}
              </span>
              <div className="relative flex-1 h-3 bg-panel rounded border border-line">
                {s.flaggedDays.map((d) => (
                  <span
                    key={d}
                    className={`absolute top-0.5 bottom-0.5 w-1 rounded-sm ${SYSTEM_COLORS[s.sysId].dot}`}
                    style={{ left: `${(d / 180) * 100}%` }}
                    title={`${s.label} flagged on Day ${d}`}
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

