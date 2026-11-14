import React from 'react';
import type { IndicatorStatus } from '@/contracts/types';
import {
  CheckCircle2,
  Info,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export type DisplayStatus = IndicatorStatus | 'info' | 'review' | 'urgent';

export interface StatusPillProps {
  status: DisplayStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  'ok' | 'info' | 'watch' | 'review' | 'urgent',
  { label: string; bgClass: string; textClass: string; borderClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ok: {
    label: 'Steady',
    bgClass: 'bg-status-ok-soft text-status-ok',
    textClass: 'text-status-ok',
    borderClass: 'border-status-ok/30',
    icon: CheckCircle2,
  },
  info: {
    label: 'Expected',
    bgClass: 'bg-status-info-soft text-status-info',
    textClass: 'text-status-info',
    borderClass: 'border-status-info/30',
    icon: Info,
  },
  watch: {
    label: 'Watch',
    bgClass: 'bg-status-watch-soft text-status-watch',
    textClass: 'text-status-watch',
    borderClass: 'border-status-watch/35',
    icon: AlertCircle,
  },
  review: {
    label: 'Review',
    bgClass: 'bg-status-review-soft text-status-review',
    textClass: 'text-status-review',
    borderClass: 'border-status-review/35',
    icon: AlertTriangle,
  },
  urgent: {
    label: 'Urgent',
    bgClass: 'bg-status-urgent-soft text-status-urgent',
    textClass: 'text-status-urgent',
    borderClass: 'border-status-urgent/40',
    icon: AlertOctagon,
  },
};

export function StatusPill({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}: StatusPillProps) {
  const normalizedKey = status === 'flagged' ? 'review' : status;
  const config = STATUS_CONFIG[normalizedKey] ?? STATUS_CONFIG.ok;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-pill border select-none ${config.bgClass} ${config.borderClass} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} flex-shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
