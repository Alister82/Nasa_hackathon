import React from 'react';
import { CircleAlert, Eye, Flag, TriangleAlert } from '@/ui/components/icons';
import type { IconComponent } from '@/ui/components/icons';
import type { SeverityLevel } from '@/contracts/types';
import { cn } from '@/ui/lib/format';

const CONFIG: Record<
  SeverityLevel,
  { Icon: IconComponent; className: string }
> = {
  urgent: { Icon: TriangleAlert, className: 'bg-status-urgent text-white' },
  review: { Icon: Flag, className: 'bg-status-review-soft text-status-review' },
  watch: { Icon: Eye, className: 'bg-status-watch-soft text-status-watch' },
  info: { Icon: CircleAlert, className: 'bg-instrument-soft text-instrument' },
};

export function SeverityMark({ severity, className }: { severity: SeverityLevel; className?: string }) {
  const { Icon, className: tone } = CONFIG[severity];
  return (
    <span
      className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]', tone, className)}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" weight="fill" />
    </span>
  );
}
