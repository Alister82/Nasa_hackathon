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
      className="flex items-center justify-between p-3.5 bg-bg-surface hover:bg-bg-surface-2 border-b border-border cursor-pointer transition-colors relative overflow-hidden min-h-[44px]"
      aria-label={`${DOMAIN_LABELS[domain]}, ${statusType}. ${summary}`}
    >
      {/* Left status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} aria-hidden="true" />

      {/* Content */}
      <div className="pl-3 flex flex-col flex-1 min-w-0 pr-3">
        <span className="font-semibold text-sm sm:text-base text-text-primary truncate">
          {DOMAIN_LABELS[domain]}
        </span>
        <span className="text-xs sm:text-sm text-text-secondary truncate">
          {summary || 'Measurements within typical adaptation range.'}
        </span>
      </div>

      {/* Status Chip */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <StatusChip status={statusType} />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-secondary"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </li>
  );
}
