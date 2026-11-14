import React, { useState } from 'react';
import type { AlertCard, EvidenceStrength, SeverityLevel, SourceRef } from '@/contracts/types';
import { SUPPLIES } from '@/guidance';
import { StatusChip, type StatusType } from './StatusChip';

export interface AlertCardViewProps {
  card: AlertCard;
  sources: Record<string, SourceRef>;
  onLog?: (card: AlertCard) => void;
  defaultOpen?: boolean;
}

const SEVERITY_BAR_COLOR: Record<SeverityLevel, string> = {
  urgent: 'bg-status-urgent',
  review: 'bg-status-review',
  watch: 'bg-status-watch',
  info: 'bg-status-info',
};

function mapSeverityToStatus(severity: SeverityLevel): StatusType {
  return severity;
}

function supplyLabel(id: string): string {
  return SUPPLIES.find((supply) => supply.id === id)?.label ?? id.replace(/_/g, ' ');
}

const SECTION_HEADING = 'text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

export function AlertCardView({ card, sources, onLog, defaultOpen }: AlertCardViewProps) {
  const isDefaultOpen = defaultOpen ?? (card.severity === 'review' || card.severity === 'urgent');
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  const tierSegments: Record<EvidenceStrength, number> = { low: 1, moderate: 2, high: 3 };
  const filledSegments = tierSegments[card.uncertainty.tier] ?? 1;

  const toggleEvidenceDays = (index: number) => {
    setExpandedEvidence((previous) => ({ ...previous, [index]: !previous[index] }));
  };

  return (
    <article
      className="bg-bg-surface rounded-2xl border border-border shadow-xs hover:shadow-md transition-shadow relative overflow-hidden mb-4"
      aria-labelledby={`card-title-${card.id}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${SEVERITY_BAR_COLOR[card.severity]}`}
        aria-hidden="true"
      />

      <div className="pl-6 pr-5 py-3.5 flex items-center justify-between gap-3 border-b border-border flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusChip status={mapSeverityToStatus(card.severity)} />
          <h2 id={`card-title-${card.id}`} className="font-bold text-base sm:text-lg text-text-primary">
            {card.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-semibold text-text-secondary tabular-nums">
            Day {card.day}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold text-accent hover:underline p-1 min-h-[44px] min-w-[44px] inline-flex items-center gap-1"
            aria-expanded={isOpen}
          >
            {isOpen ? 'Collapse' : 'Show details'}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </button>
        </div>
      </div>

      <div className="pl-6 pr-5 py-4">
        <h3 className={SECTION_HEADING}>What changed</h3>
        <p className="text-sm sm:text-base text-text-primary leading-relaxed">{card.observation}</p>
      </div>

      {isOpen && (
        <div className="divide-y divide-border border-t border-border text-sm sm:text-base">
          {card.evidence.length > 0 && (
            <div className="pl-6 pr-5 py-4">
              <h3 className={SECTION_HEADING}>Evidence</h3>
              <ul className="list-disc pl-5 space-y-2 text-text-primary">
                {card.evidence.map((evidence, index) => (
                  <li key={`${evidence.indicatorId}-${index}`} className="leading-relaxed">
                    <span>{evidence.text}</span>
                    {evidence.days.length > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleEvidenceDays(index)}
                          className="text-xs font-semibold text-accent hover:underline min-h-[44px] inline-flex items-center"
                        >
                          {expandedEvidence[index] ? 'Hide days' : 'Show days'}
                        </button>
                        {expandedEvidence[index] && (
                          <span className="text-xs text-text-secondary block tabular-nums mt-0.5">
                            Observed days: {evidence.days.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pl-6 pr-5 py-4">
            <h3 className={SECTION_HEADING}>What we do not know</h3>
            <p className="text-text-primary mb-3">{card.uncertainty.statement}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-text-secondary">Evidence strength:</span>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`w-5 h-2 rounded-sm ${
                      segment <= filledSegments ? 'bg-accent' : 'bg-bg-app border border-border'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-text-primary capitalize">
                {card.uncertainty.tier}
              </span>
            </div>

            {card.uncertainty.missingInfo.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-text-secondary block mb-1">
                  Open questions:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-text-secondary">
                  {card.uncertainty.missingInfo.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {card.recommendedActions.length > 0 && (
            <div className="pl-6 pr-5 py-4">
              <h3 className={SECTION_HEADING}>Do now</h3>
              <ol className="list-decimal pl-5 space-y-2 text-text-primary">
                {card.recommendedActions.map((action, index) => (
                  <li key={`${card.id}-${action.id}-${index}`} className="leading-relaxed">
                    {action.supplyAvailable ? (
                      <span>{action.text}</span>
                    ) : (
                      <span>
                        <span>{action.alternativeText ?? action.text}</span>{' '}
                        {action.requiresSupply && (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 bg-status-watch/10 text-status-watch ring-1 ring-inset ring-status-watch/20 rounded-full ml-1">
                            No {supplyLabel(action.requiresSupply)} aboard
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {card.nextMeasurements.length > 0 && (
            <div className="pl-6 pr-5 py-4">
              <h3 className={SECTION_HEADING}>Measure next</h3>
              <ul className="list-disc pl-5 space-y-1 text-text-primary">
                {card.nextMeasurements.map((measurement, index) => (
                  <li key={index}>{measurement}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pl-6 pr-5 py-4">
            <h3 className={SECTION_HEADING}>Who to contact</h3>
            <p className="text-text-primary font-medium leading-relaxed">{card.escalation.text}</p>
            {card.escalation.expectedReplyMinutes !== null && (
              <p className="text-xs text-text-secondary mt-1">
                Reply expected in at least {card.escalation.expectedReplyMinutes} minutes.
              </p>
            )}
          </div>

          <div className="pl-6 pr-5 py-3.5 bg-bg-app/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Sources: </span>
              {card.sourceIds.map((sourceId, index) => {
                const source = sources[sourceId];
                const title = source?.title ?? sourceId;
                const url = source?.url;
                return (
                  <span key={sourceId}>
                    {index > 0 && '; '}
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline hover:opacity-80 inline-flex items-center min-h-[44px]"
                      >
                        {title}
                      </a>
                    ) : (
                      <span>{title} (source link pending)</span>
                    )}
                  </span>
                );
              })}
            </div>

            {onLog && (
              <button
                type="button"
                onClick={() => onLog(card)}
                className="px-3.5 py-1.5 bg-bg-surface border border-border hover:bg-bg-app text-text-primary text-xs font-bold rounded-xl transition-colors min-h-[44px] flex-shrink-0"
              >
                Log what I did
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
