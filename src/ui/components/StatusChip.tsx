import React from 'react';
import { Check, Eye, Flag, Info, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/ui/lib/format';

export type StatusType = 'ok' | 'info' | 'watch' | 'review' | 'urgent';

export interface StatusChipProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    word: string;
    className: string;
    Icon: LucideIcon;
  }
> = {
  ok: { word: 'Steady', className: 'chip-ok', Icon: Check },
  info: { word: 'Expected', className: 'chip-primary', Icon: Info },
  watch: { word: 'Watch', className: 'chip-watch', Icon: Eye },
  review: { word: 'Review', className: 'chip-review', Icon: Flag },
  urgent: { word: 'Urgent', className: 'chip-urgent', Icon: TriangleAlert },
};

export function StatusChip({ status, label, className }: StatusChipProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;
  const displayText = label ?? config.word;
  const { Icon } = config;

  return (
    <span className={cn('chip', config.className, className)} role="status">
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden={true} />
      <span>{displayText}</span>
    </span>
  );
}
