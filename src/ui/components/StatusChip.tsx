import React from 'react';
import {
  CheckCircleIcon,
  InfoCircleIcon,
  EyeIcon,
  FlagIcon,
  AlertTriangleIcon,
} from './Icons';

export type StatusType = 'ok' | 'info' | 'watch' | 'review' | 'urgent';

export interface StatusChipProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    word: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    Icon: React.ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>;
  }
> = {
  ok: {
    word: 'Steady',
    bgClass: 'bg-status-ok-soft',
    textClass: 'text-status-ok',
    borderClass: 'border-status-ok',
    Icon: CheckCircleIcon,
  },
  info: {
    word: 'Expected',
    bgClass: 'bg-status-info-soft',
    textClass: 'text-status-info',
    borderClass: 'border-status-info',
    Icon: InfoCircleIcon,
  },
  watch: {
    word: 'Watch',
    bgClass: 'bg-status-watch-soft',
    textClass: 'text-status-watch',
    borderClass: 'border-status-watch',
    Icon: EyeIcon,
  },
  review: {
    word: 'Review',
    bgClass: 'bg-status-review-soft',
    textClass: 'text-status-review',
    borderClass: 'border-status-review',
    Icon: FlagIcon,
  },
  urgent: {
    word: 'Urgent',
    bgClass: 'bg-status-urgent-soft',
    textClass: 'text-status-urgent',
    borderClass: 'border-status-urgent',
    Icon: AlertTriangleIcon,
  },
};

export function StatusChip({ status, label }: StatusChipProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;
  const displayText = label ?? config.word;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-sm font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      role="status"
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{displayText}</span>
    </span>
  );
}
