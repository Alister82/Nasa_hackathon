import React from 'react';
import type { DomainId, DomainAnalysis, IndicatorStatus } from '@/contracts/types';
import { DOMAIN_LABELS } from '@/contracts/indicators';
import { StatusChip, type StatusType } from './StatusChip';

export interface DomainRowProps {
  domain: DomainId;
  analysis: DomainAnalysis;
  summary: string;
  onOpen: (d: DomainId) => void;
}

const STATUS_BAR_COLOR: Record<IndicatorStatus, string> = {
  ok: 'bg-status-ok',
  watch: 'bg-status-watch',
  flagged: 'bg-status-review',
};

function mapStatusToType(status: IndicatorStatus): StatusType {
  if (status === 'flagged') return 'review';
  return status as StatusType;
}

export function DomainRow({ domain, analysis, summary, onOpen }: DomainRowProps) {
  const status = analysis?.status ?? 'ok';
  const barColor = STATUS_BAR_COLOR[status] ?? 'bg-status-ok';
  const statusType = mapStatusToType(status);

  return (
    <li
      onClick={() => onOpen(domain)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(domain);
        }
      }}
      tabIndex={0}
      role="button"
      className="flex items-center justify-between p-3.5 bg-panel hover:bg-ceramic/60 border-b border-line cursor-pointer transition-colors relative overflow-hidden min-h-[44px]"
      aria-label={`${DOMAIN_LABELS[domain]}, ${statusType}. ${summary}`}
    >
      {/* Left 6px status bar in strong color */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`} aria-hidden="true" />

      {/* Content */}
      <div className="pl-3 flex flex-col flex-1 min-w-0 pr-3">
        <span className="font-bold text-sm sm:text-base text-ink truncate">
          {DOMAIN_LABELS[domain]}
        </span>
        <span className="text-xs sm:text-sm text-ink-soft truncate">
          {summary || 'Measurements within typical adaptation range.'}
        </span>
      </div>

      {/* Status Chip */}
      <div className="flex-shrink-0">
        <StatusChip status={statusType} />
      </div>
    </li>
  );
}
