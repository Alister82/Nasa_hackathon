import React from 'react';
import type { DisplayStatus } from './StatusPill';

export interface RangeGaugeProps {
  value: number | null;
  min: number;
  max: number;
  baselineRange?: [number, number];
  referenceRange?: [number, number];
  unit?: string;
  status?: DisplayStatus;
  className?: string;
}

export function RangeGauge({
  value,
  min,
  max,
  baselineRange,
  referenceRange,
  unit,
  status = 'ok',
  className = '',
}: RangeGaugeProps) {
  const span = max - min || 1;
  const toPct = (val: number) => Math.max(0, Math.min(100, ((val - min) / span) * 100));

  const statusColor: Record<string, string> = {
    ok: 'var(--status-ok)',
    info: 'var(--status-info)',
    watch: 'var(--status-watch)',
    review: 'var(--status-review)',
    flagged: 'var(--status-review)',
    urgent: 'var(--status-urgent)',
  };

  const currentColor = statusColor[status] ?? 'var(--instrument)';

  return (
    <div className={`flex flex-col gap-1 w-full select-none ${className}`}>
      {/* Gauge bar container */}
      <div className="relative h-2.5 w-full bg-line/30 rounded-pill overflow-hidden">
        {/* Reference Normal Range Band (if given) */}
        {referenceRange && (
          <div
            className="absolute top-0 bottom-0 bg-status-ok-soft/80"
            style={{
              left: `${toPct(referenceRange[0])}%`,
              width: `${toPct(referenceRange[1]) - toPct(referenceRange[0])}%`,
            }}
            title="General Reference Range"
          />
        )}

        {/* Personal Pre-flight Baseline Band */}
        {baselineRange && (
          <div
            className="absolute top-0 bottom-0 bg-instrument/20 border-x border-instrument/40"
            style={{
              left: `${toPct(baselineRange[0])}%`,
              width: `${Math.max(2, toPct(baselineRange[1]) - toPct(baselineRange[0]))}%`,
            }}
            title="Pre-flight Baseline Band"
          />
        )}

        {/* Current Value Marker */}
        {value !== null && Number.isFinite(value) && (
          <div
            className="absolute top-0 bottom-0 w-2 -ml-1 rounded-pill shadow-sm transition-all duration-300"
            style={{
              left: `${toPct(value)}%`,
              backgroundColor: currentColor,
            }}
          />
        )}
      </div>

      {/* Axis min/max labels */}
      <div className="flex justify-between items-center text-[11px] text-ink-muted tabular-nums">
        <span>{min}</span>
        {baselineRange && (
          <span className="text-[10px] text-instrument font-medium">
            Baseline: {baselineRange[0].toFixed(0)}–{baselineRange[1].toFixed(0)} {unit ?? ''}
          </span>
        )}
        <span>{max}</span>
      </div>
    </div>
  );
}
