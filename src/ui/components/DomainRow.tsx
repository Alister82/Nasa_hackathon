import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { DomainId, DomainAnalysis } from '@/contracts/types';
import { DOMAIN_LABELS } from '@/contracts/indicators';
import { DomainIcon, DOMAIN_VISUALS } from './MetricTile';
import { cn } from '@/ui/lib/format';

export interface DomainRowProps {
  domain: DomainId;
  analysis: DomainAnalysis;
  summary: string;
  onOpen: (d: DomainId) => void;
  selected?: boolean;
}

const STATUS_MARK = {
  ok: { Icon: CheckCircle2, tone: 'text-status-ok', label: 'Steady' },
  watch: { Icon: AlertTriangle, tone: 'text-status-watch', label: 'Watch' },
  flagged: { Icon: AlertTriangle, tone: 'text-status-review', label: 'Review' },
} as const;

export function DomainRow({ domain, analysis, summary, onOpen, selected = false }: DomainRowProps) {
  const status = analysis?.status ?? 'ok';
  const statusMeta = STATUS_MARK[status];
  const StatusIcon = statusMeta.Icon;
  const visual = DOMAIN_VISUALS[domain];

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(domain)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(domain);
          }
        }}
        aria-label={`${DOMAIN_LABELS[domain]}, ${statusMeta.label}: ${summary}. Open details.`}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-all',
          selected
            ? 'border-instrument/25 bg-instrument-soft/70 shadow-xs'
            : 'border-transparent hover:border-line hover:bg-white/80',
        )}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundColor: visual.soft, color: visual.color }}
          aria-hidden="true"
        >
          <DomainIcon domain={domain} className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.78rem] font-semibold text-ink" title={DOMAIN_LABELS[domain]}>
            {visual.short}
          </span>
          <span className="mt-0.5 block truncate text-[0.65rem] text-ink-soft">{summary}</span>
        </span>

        <span
          className={cn('hidden shrink-0 sm:block', statusMeta.tone)}
          title={statusMeta.label}
          aria-label={statusMeta.label}
        >
          <StatusIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </li>
  );
}
