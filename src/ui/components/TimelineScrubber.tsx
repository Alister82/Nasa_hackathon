import React from 'react';
import { FlagIcon } from './Icons';

export interface ScrubberMarker {
  day: number;
  status: 'review' | 'urgent' | 'watch';
  label: string;
}

export interface TimelineScrubberProps {
  day: number;
  maxDay: number;
  markers: ScrubberMarker[];
  onChange: (d: number) => void;
  onToday: () => void;
  onPlayDemo: () => void;
}

const MARKER_COLOR: Record<ScrubberMarker['status'], string> = {
  urgent: 'text-status-urgent',
  review: 'text-status-review',
  watch: 'text-status-watch',
};

export function TimelineScrubber({
  day,
  maxDay = 180,
  markers = [],
  onChange,
  onToday,
  onPlayDemo,
}: TimelineScrubberProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(maxDay, day + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, day - 1));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      onChange(Math.min(maxDay, day + 10));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      onChange(Math.max(1, day - 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(maxDay);
    }
  };

  const ticks = [30, 60, 90, 120, 150, 180].filter((t) => t <= maxDay);

  return (
    <div className="bg-panel border border-line rounded-sheet p-4 shadow-sm w-full">
      {/* Top Header: Day Display + Buttons */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-soft font-bold">Mission Timeline</span>
          <span className="text-lg font-bold text-ink tabular-nums">
            Day {day} of {maxDay}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 bg-panel border border-line rounded-input text-xs sm:text-sm font-medium text-ink hover:bg-ceramic min-h-[44px]"
            title="Jump to current mission day (Day 120)"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onPlayDemo}
            className="px-3 py-1.5 bg-instrument text-panel rounded-input text-xs sm:text-sm font-bold hover:opacity-90 min-h-[44px]"
            title="Play demo story (Crew 1, Day 120, Deep Space, Slow Drift)"
          >
            Play demo story
          </button>
        </div>
      </div>

      {/* Scrubber slider track & markers */}
      <div className="relative pt-4 pb-2">
        {/* Flag markers on track */}
        <div className="absolute top-0 left-0 right-0 h-4 pointer-events-none" aria-hidden="true">
          {markers.map((m, idx) => {
            const pct = Math.max(0, Math.min(100, ((m.day - 1) / (maxDay - 1)) * 100));
            const colorClass = MARKER_COLOR[m.status] ?? 'text-status-review';
            return (
              <div
                key={`${m.day}-${idx}`}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pct}%` }}
                title={`${m.label} on Day ${m.day}`}
              >
                <FlagIcon className={`w-3.5 h-3.5 ${colorClass}`} />
              </div>
            );
          })}
        </div>

        {/* Range Input */}
        <label htmlFor="mission-day-scrubber" className="sr-only">
          Scrub mission day (1 to {maxDay})
        </label>
        <input
          id="mission-day-scrubber"
          type="range"
          min={1}
          max={maxDay}
          value={day}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          aria-valuemin={1}
          aria-valuemax={maxDay}
          aria-valuenow={day}
          aria-valuetext={`Day ${day} of ${maxDay}`}
          className="w-full h-2 bg-ceramic rounded-lg appearance-none cursor-pointer accent-instrument focus:outline-none min-h-[44px]"
        />

        {/* Tick labels */}
        <div className="flex justify-between text-[11px] text-ink-soft font-medium mt-1 tabular-nums px-0.5">
          <span>Day 1</span>
          {ticks.map((t) => (
            <span key={t}>Day {t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

