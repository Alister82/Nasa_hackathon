import React, { useId, useState } from 'react';
import {
  AlertOctagon,
  Bookmark,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  ExternalLink,
  FlaskConical,
  Stethoscope,
  Pill,
} from 'lucide-react';
import type { AlertCard, EvidenceStrength, SeverityLevel, SourceRef } from '@/contracts/types';
import { SUPPLIES } from '@/guidance';
import { SeverityMark } from './SeverityMark';
import { cn } from '@/ui/lib/format';

export interface AlertCardViewProps {
  card: AlertCard;
  sources: Record<string, SourceRef>;
  onLog?: (card: AlertCard) => void;
  defaultOpen?: boolean;
  detailMode?: boolean;
}

const SEVERITY_STYLES: Record<
  SeverityLevel,
  { accent: string; soft: string; text: string; label: string }
> = {
  urgent: { accent: 'bg-status-urgent', soft: 'bg-status-urgent-soft', text: 'text-status-urgent', label: 'Urgent' },
  review: { accent: 'bg-status-review', soft: 'bg-status-review-soft', text: 'text-status-review', label: 'Review' },
  watch: { accent: 'bg-status-watch', soft: 'bg-status-watch-soft', text: 'text-status-watch', label: 'Watch' },
  info: { accent: 'bg-instrument', soft: 'bg-instrument-soft', text: 'text-instrument', label: 'Expected' },
};

const SECTION_HEADING =
  'flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-faint mb-2';

function supplyLabel(id: string): string {
  return SUPPLIES.find((supply) => supply.id === id)?.label ?? id.replace(/_/g, ' ');
}

export function AlertCardView({ card, sources, onLog, defaultOpen, detailMode }: AlertCardViewProps) {
  const isDefaultOpen = defaultOpen ?? (card.severity === 'review' || card.severity === 'urgent');
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const showDetails = detailMode || isOpen;
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const tierSegments: Record<EvidenceStrength, number> = { low: 1, moderate: 2, high: 3 };
  const filledSegments = tierSegments[card.uncertainty.tier] ?? 1;
  const style = SEVERITY_STYLES[card.severity];
  const panelId = `card-panel-${card.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const titleId = `card-title-${card.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const rawId = useId().replace(/:/g, '');

  const toggleEvidenceDays = (index: number) => {
    setExpandedEvidence((previous) => ({ ...previous, [index]: !previous[index] }));
  };

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[20px] border bg-white/86 shadow-card backdrop-blur-sm transition-shadow hover:shadow-float',
        detailMode && 'rounded-none border-0 bg-transparent shadow-none hover:shadow-none',
        !detailMode &&
          (card.severity === 'urgent'
            ? 'border-status-urgent/30 ring-1 ring-status-urgent/10'
            : card.severity === 'review'
              ? 'border-status-review/25'
              : 'border-line'),
      )}
      aria-labelledby={titleId}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', style.accent)} aria-hidden="true" />
      <span
        className={cn('pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-[0.13] blur-2xl', style.accent)}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 pl-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <SeverityMark severity={card.severity} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('chip', style.soft, style.text, 'capitalize')}>{style.label}</span>
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold text-ink-faint">
                Day {card.day}
              </span>
              {card.domains.slice(0, 2).map((domain) => (
                <span key={domain} className="text-[0.6rem] font-medium text-ink-faint">
                  · {domain.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <h2 id={titleId} className="mt-1 font-display text-[0.95rem] font-bold leading-snug tracking-[-0.02em] text-ink">
              {card.title}
            </h2>
          </div>
        </div>
        {!detailMode && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-line bg-white/80 px-2.5 text-[0.66rem] font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            aria-expanded={isOpen}
            aria-controls={panelId}
          >
            {isOpen ? 'Collapse' : 'Show details'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pl-5">
        <h3 className={SECTION_HEADING}>
          <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
          What changed
        </h3>
        <p className="text-[0.8rem] leading-relaxed text-ink-2">{card.observation}</p>
      </div>

      {showDetails && (
        <div id={panelId} className="border-t border-line/80">
          {card.evidence.length > 0 && (
            <section className="px-4 py-3.5 pl-5">
              <h3 className={SECTION_HEADING}>
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Evidence
              </h3>
              <ul className="space-y-2.5">
                {card.evidence.map((evidence, index) => (
                  <li key={`${evidence.indicatorId}-${index}`} className="rounded-xl border border-line/80 bg-surface2/70 px-3 py-2">
                    <p className="text-[0.76rem] leading-relaxed text-ink-2">{evidence.text}</p>
                    {evidence.days.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEvidenceDays(index)}
                          className="inline-flex min-h-[44px] items-center gap-1 text-[0.64rem] font-semibold text-instrument hover:text-instrument-deep hover:underline"
                        >
                          <Bookmark className="h-3 w-3" aria-hidden="true" />
                          {expandedEvidence[index] ? 'Hide days' : 'Show days'}
                        </button>
                        {expandedEvidence[index] && (
                          <span className="text-[0.64rem] tabular-nums text-ink-soft">
                            Observed days: {evidence.days.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-line/80 px-4 py-3.5 pl-5">
            <h3 className={SECTION_HEADING}>
              <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
              What we do not know
            </h3>
            <p className="text-[0.76rem] leading-relaxed text-ink-2">{card.uncertainty.statement}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] font-semibold text-ink-soft">Evidence strength</span>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={cn(
                      'h-1.5 w-5 rounded-full',
                      segment <= filledSegments ? 'bg-instrument' : 'bg-line',
                    )}
                  />
                ))}
              </div>
              <span className="text-[0.62rem] font-bold capitalize text-ink">{card.uncertainty.tier}</span>
            </div>

            {card.uncertainty.missingInfo.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {card.uncertainty.missingInfo.map((question, index) => (
                  <li key={index} className="flex gap-1.5 text-[0.7rem] leading-relaxed text-ink-soft">
                    <span className="text-ink-faint" aria-hidden="true">—</span>
                    {question}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {card.recommendedActions.length > 0 && (
            <section className="border-t border-line/80 px-4 py-3.5 pl-5">
              <h3 className={SECTION_HEADING}>
                <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                Do now
              </h3>
              <ol className="space-y-2">
                {card.recommendedActions.map((action, index) => (
                  <li key={`${card.id}-${action.id}-${index}`} className="flex gap-2.5 text-[0.76rem] leading-relaxed text-ink-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-instrument-soft text-[0.56rem] font-bold text-instrument-deep tabular-nums">
                      {index + 1}
                    </span>
                    <span>
                      {action.supplyAvailable ? (
                        action.text
                      ) : (
                        <>
                          {action.alternativeText ?? action.text}
                          {action.requiresSupply && (
                            <span className="ml-1.5 inline-block rounded-full border border-status-watch/25 bg-status-watch-soft px-1.5 py-0.5 align-middle text-[0.56rem] font-semibold text-status-watch">
                              No {supplyLabel(action.requiresSupply)} aboard
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {card.nextMeasurements.length > 0 && (
            <section className="border-t border-line/80 px-4 py-3.5 pl-5">
              <h3 className={SECTION_HEADING}>
                <Pill className="h-3.5 w-3.5" aria-hidden="true" />
                Measure next
              </h3>
              <ul className="space-y-1.5">
                {card.nextMeasurements.map((measurement, index) => (
                  <li key={index} className="flex items-center gap-2 text-[0.76rem] text-ink-2">
                    <span className="h-1 w-1 rounded-full bg-instrument" aria-hidden="true" />
                    {measurement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-line/80 px-4 py-3.5 pl-5">
            <h3 className={SECTION_HEADING}>
              <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
              Who to contact
            </h3>
            <p className="text-[0.78rem] font-medium leading-relaxed text-ink">{card.escalation.text}</p>
            {card.escalation.expectedReplyMinutes !== null && (
              <p className="mt-1 text-[0.66rem] text-ink-soft">
                Reply expected in at least {card.escalation.expectedReplyMinutes} minutes.
              </p>
            )}
          </section>

          <footer className="flex flex-col gap-2.5 border-t border-line/80 bg-surface2/70 px-4 py-3 pl-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.62rem] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink-2">Sources: </span>
              {card.sourceIds.map((sourceId, index) => {
                const source = sources[sourceId];
                const title = source?.title ?? sourceId;
                const url = source?.url;
                return (
                  <span key={`${rawId}-${sourceId}`}>
                    {index > 0 && ' · '}
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-0.5 align-middle text-instrument underline-offset-2 hover:underline"
                      >
                        {title}
                        <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <span>{title} (source link pending)</span>
                    )}
                  </span>
                );
              })}
            </p>

            {onLog && (
              <button
                type="button"
                onClick={() => onLog(card)}
                className="btn btn-secondary shrink-0 !min-h-[44px] !px-3 !text-[0.68rem]"
              >
                Log what I did
              </button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}
