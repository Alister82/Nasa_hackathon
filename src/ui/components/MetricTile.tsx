import React from 'react';
import type { DisplayStatus } from './StatusPill';
import { GlassCard } from './GlassCard';
import { StatusPill } from './StatusPill';
import { Sparkline } from './Sparkline';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricTileProps {
  title: string;
  value: number | null;
  unit: string;
  status: DisplayStatus;
  deltaText?: string;
  deltaDirection?: 'up' | 'down' | 'neutral';
  sparklineValues?: (number | null)[];
  sparklineBaseline?: number;
  onClick?: () => void;
  className?: string;
}

export function MetricTile({
  title,
  value,
  unit,
  status,
  deltaText,
  deltaDirection = 'neutral',
  sparklineValues,
  sparklineBaseline,
  onClick,
  className = '',
}: MetricTileProps) {
  const displayValue = value !== null && Number.isFinite(value) ? value : '—';

  return (
    <GlassCard
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className={`flex flex-col justify-between gap-3 min-h-[140px] select-none ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${displayValue} ${unit}. Status: ${status}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top Header: Title & Status Pill */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm font-semibold text-ink-soft truncate">
          {title}
        </span>
        <StatusPill status={status} size="sm" />
      </div>

      {/* Middle: Big Telemetry Reading + Unit */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums tracking-tight">
          {displayValue}
        </span>
        <span className="text-xs sm:text-sm text-ink-muted font-medium">{unit}</span>
      </div>

      {/* Bottom Footer: Delta chip + Sparkline */}
      <div className="flex items-end justify-between gap-2 mt-auto pt-1">
        {deltaText ? (
          <div className="flex items-center gap-1 text-[11px] font-medium text-ink-soft tabular-nums">
            {deltaDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-status-review flex-shrink-0" />}
            {deltaDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-status-info flex-shrink-0" />}
            {deltaDirection === 'neutral' && <Minus className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />}
            <span className="truncate">{deltaText}</span>
          </div>
        ) : (
          <div />
        )}

        {sparklineValues && sparklineValues.length > 0 && (
          <div className="flex-shrink-0">
            <Sparkline
              values={sparklineValues}
              baseline={sparklineBaseline}
              status={status}
              width={90}
              height={28}
            />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
