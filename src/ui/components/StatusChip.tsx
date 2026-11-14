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
    cls: string;
    Icon: React.ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>;
  }
> = {
  ok: {
    word: 'Steady',
    cls: 'bg-status-ok/10 text-status-ok ring-status-ok/20',
    Icon: CheckCircleIcon,
  },
  info: {
    word: 'Expected',
    cls: 'bg-status-info/10 text-status-info ring-status-info/20',
    Icon: InfoCircleIcon,
  },
  watch: {
    word: 'Watch',
    cls: 'bg-status-watch/10 text-status-watch ring-status-watch/20',
    Icon: EyeIcon,
  },
  review: {
    word: 'Review',
    cls: 'bg-status-review/10 text-status-review ring-status-review/20',
    Icon: FlagIcon,
  },
  urgent: {
    word: 'Urgent',
    cls: 'bg-status-urgent/10 text-status-urgent ring-status-urgent/20',
    Icon: AlertTriangleIcon,
  },
};

export function StatusChip({ status, label }: StatusChipProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;
  const displayText = label ?? config.word;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${config.cls}`}
      role="status"
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
      <span>{displayText}</span>
    </span>
  );
}
