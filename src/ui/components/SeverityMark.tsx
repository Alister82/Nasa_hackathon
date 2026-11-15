import React from 'react';
import { CircleAlert, Eye, Flag, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SeverityLevel } from '@/contracts/types';
import { cn } from '@/ui/lib/format';

const CONFIG: Record<
  SeverityLevel,
  { Icon: LucideIcon; className: string }
> = {
  urgent: { Icon: TriangleAlert, className: 'bg-status-urgent text-white' },
  review: { Icon: Flag, className: 'bg-status-review-soft text-status-review ring-1 ring-status-review/20' },
  watch: { Icon: Eye, className: 'bg-status-watch-soft text-status-watch ring-1 ring-status-watch/20' },
  info: { Icon: CircleAlert, className: 'bg-instrument-soft text-instrument ring-1 ring-instrument/15' },
};

export function SeverityMark({ severity, className }: { severity: SeverityLevel; className?: string }) {
  const { Icon, className: tone } = CONFIG[severity];
  return (
    <span
      className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]', tone, className)}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}
