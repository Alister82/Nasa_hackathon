import React from 'react';
import { Crosshair, Info, Radar } from 'lucide-react';
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
  vigil: 'var(--instrument)',
  threshold: 'var(--status-watch)',
  zscore: 'var(--status-review)',
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

  const leader = [...stats]
    .filter((system) => system.firstFlagDay !== 'None')
    .sort((a, b) => a.flaggedDays[0]! - b.flaggedDays[0]!)[0];

  return (
    <section className="panel overflow-hidden" aria-label="Detection system comparison">
      <header className="relative overflow-hidden border-b border-line/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(240,247,255,0.9))] px-4 py-3.5">
        <div
          className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(78,139,235,0.18),transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.05rem] font-extrabold tracking-[-0.03em] text-ink">
              Who flags first
            </h2>
            <p className="mt-0.5 max-w-xl text-[0.68rem] leading-relaxed text-ink-soft">
              Detection timing and pre-onset flags for this scenario. The ground-truth onset comes
              from the simulator, so a negative “days after onset” means a flag before onset.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {leader && (
              <span className="chip chip-primary">
                <Crosshair className="h-3 w-3" aria-hidden="true" />
                Earliest: {leader.label}
              </span>
            )}
            {onsetDay !== null && (
              <span className="chip chip-review">Onset day {onsetDay}</span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-3">
        {stats.map((system) => (
          <article
            key={system.systemId}
            className="rounded-[14px] border border-line bg-white/75 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SYSTEM_COLORS[system.systemId] }}
                aria-hidden="true"
              />
              <p className="text-[0.72rem] font-bold text-ink">{system.label}</p>
            </div>
            <p className="metric-number mt-1 text-[1.25rem] leading-none">{system.firstFlagDay}</p>
            <p className="mt-1 text-[0.6rem] text-ink-soft">
              {system.daysAfterOnset === '-' ? 'No onset reference' : `${system.daysAfterOnset} days from onset`}
              {' · '}
              {system.flagsBeforeOnset} pre-onset
            </p>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto border-t border-line/80">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col" className="text-center">First flag day</th>
              <th scope="col" className="text-center">Days after onset</th>
              <th scope="col" className="text-center">Flags before onset</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {stats.map((system) => (
              <tr key={system.systemId}>
                <td>
                  <span className="inline-flex items-center gap-2 font-semibold text-ink">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SYSTEM_COLORS[system.systemId] }}
                      aria-hidden="true"
                    />
                    {system.label}
                  </span>
                </td>
                <td className="text-center">{system.firstFlagDay}</td>
                <td className="text-center">{system.daysAfterOnset}</td>
                <td className="text-center">{system.flagsBeforeOnset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-line/80 px-3.5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.66rem] font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-instrument" aria-hidden="true" />
            Flag timeline across mission days 1 to {dataset.missionDays}
          </span>
          {onsetDay !== null && (
            <span className="font-bold text-status-urgent">Known onset: day {onsetDay}</span>
          )}
        </div>

        <div className="relative overflow-hidden rounded-[14px] border border-line bg-surface2/70 px-3 py-3">
          {onsetDay !== null && (
            <div
              className="absolute bottom-2 top-2 z-10 w-0.5 bg-status-urgent"
              style={{ left: `calc(${positionPercent(onsetDay, dataset.missionDays)}% + 0.75rem)` }}
              title={`Ground-truth onset: day ${onsetDay}`}
              aria-hidden="true"
            />
          )}

          <div className="flex flex-col gap-2.5">
            {stats.map((system) => (
              <div key={system.systemId} className="flex items-center gap-2.5">
                <span className="w-24 shrink-0 truncate text-[0.64rem] font-bold text-ink sm:w-28">
                  {system.label}
                </span>
                <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-line bg-white">
                  {system.flaggedDays.map((day) => (
                    <span
                      key={day}
                      className="absolute bottom-0.5 top-0.5 w-[3px] rounded-sm"
                      style={{
                        left: `${positionPercent(day, dataset.missionDays)}%`,
                        backgroundColor: SYSTEM_COLORS[system.systemId],
                      }}
                      title={`${system.label} flagged on day ${day}`}
                    />
                  ))}
                </div>
                <span className="w-10 shrink-0 text-right text-[0.6rem] font-semibold tabular-nums text-ink-soft">
                  {system.flaggedDays.length}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between text-[0.55rem] font-semibold tabular-nums text-ink-faint">
            <span>Day 1</span>
            <span>Day {Math.round(dataset.missionDays / 2)}</span>
            <span>Day {dataset.missionDays}</span>
          </div>
        </div>

        <p className="inline-flex items-start gap-1.5 text-[0.6rem] leading-relaxed text-ink-faint">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Simulated scenario output. Earlier flags are not automatically better: pre-onset flags
          and false episodes are shown so the trade-off stays visible.
        </p>
      </div>
    </section>
  );
}
