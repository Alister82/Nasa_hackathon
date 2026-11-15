import React from 'react';
import { CalendarClock, Flag, Play, SkipForward } from 'lucide-react';
import { cn } from '@/ui/lib/format';

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

const MARKER_BG: Record<ScrubberMarker['status'], string> = {
  urgent: 'bg-status-urgent',
  review: 'bg-status-review',
  watch: 'bg-status-watch',
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
  const progress = Math.max(0, Math.min(100, ((day - 1) / Math.max(1, maxDay - 1)) * 100));

  return (
    <section
      aria-label="Mission timeline"
      className="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/78 p-4 shadow-card backdrop-blur-md"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(80%_120%_at_50%_-40%,rgba(68,131,226,0.16),transparent_70%)]" aria-hidden="true" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-instrument/15 bg-instrument-soft text-instrument">
            <CalendarClock className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.13em] text-ink-faint">
              Mission timeline
            </p>
            <p className="font-display text-[1.15rem] font-extrabold leading-tight tracking-[-0.03em] text-ink tabular-nums">
              Day {day} of {maxDay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onToday} className="btn btn-secondary !min-h-[44px] !px-2.5 !text-[0.68rem]">
            <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
            Today
          </button>
          <button type="button" onClick={onPlayDemo} className="btn btn-primary !min-h-[44px] !px-2.5 !text-[0.68rem]">
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Play demo story
          </button>
        </div>
      </div>

      <div className="relative mt-4 pb-1">
        <div className="pointer-events-none absolute inset-x-0 top-[19px] h-1.5 overflow-hidden rounded-full bg-surface3" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7fb0f5] via-[var(--instrument)] to-[#1c56bd]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-1 h-4" aria-hidden="true">
          {markers.map((marker, index) => {
            const pct = Math.max(0, Math.min(100, ((marker.day - 1) / (maxDay - 1)) * 100));
            return (
              <div
                key={`${marker.day}-${index}`}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${pct}%` }}
                title={`${marker.label} on Day ${marker.day}`}
              >
                <Flag className={cn('h-3 w-3 drop-shadow-sm', MARKER_COLOR[marker.status])} strokeWidth={2.4} />
              </div>
            );
          })}
        </div>

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
          className="relative z-10 h-11 w-full cursor-pointer appearance-none bg-transparent accent-instrument [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-instrument [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(24,66,135,0.45)]"
        />

        <div className="mt-0.5 flex justify-between px-0.5 text-[0.6rem] font-semibold tabular-nums text-ink-faint">
          <span>Day 1</span>
          {ticks.map((tick) => (
            <span key={tick} className={cn(tick === day && 'text-instrument')}>
              Day {tick}
            </span>
          ))}
        </div>
      </div>

      {markers.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/70 pt-2">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-faint">Flags</span>
          {markers.slice(-6).map((marker, index) => (
            <span key={`${marker.day}-${index}`} className="inline-flex items-center gap-1 text-[0.6rem] text-ink-soft">
              <span className={cn('h-1.5 w-1.5 rounded-full', MARKER_BG[marker.status])} aria-hidden="true" />
              D{marker.day} · {marker.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
