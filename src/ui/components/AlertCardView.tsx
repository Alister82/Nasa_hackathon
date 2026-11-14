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

const SECTION_HEADING = 'text-sm font-bold text-ink-soft mb-1';

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
      className="bg-panel rounded-sheet border border-line shadow-card relative overflow-hidden mb-4"
      aria-labelledby={`card-title-${card.id}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${SEVERITY_BAR_COLOR[card.severity]}`}
        aria-hidden="true"
      />

      <div className="pl-5 pr-4 py-3 flex items-center justify-between gap-3 border-b border-line flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusChip status={mapSeverityToStatus(card.severity)} />
          <h2 id={`card-title-${card.id}`} className="font-bold text-base sm:text-lg text-ink">
            {card.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-ink-soft tabular-nums">
            Day {card.day}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold text-instrument hover:underline p-1 min-h-[44px] min-w-[44px]"
            aria-expanded={isOpen}
          >
            {isOpen ? 'Collapse' : 'Show details'}
          </button>
        </div>
      </div>

      <div className="pl-5 pr-4 py-3">
        <h3 className={SECTION_HEADING}>What changed</h3>
        <p className="text-sm sm:text-base text-ink leading-relaxed">{card.observation}</p>
      </div>

      {isOpen && (
        <div className="divide-y divide-line border-t border-line text-sm sm:text-base">
          {card.evidence.length > 0 && (
            <div className="pl-5 pr-4 py-3">
              <h3 className={SECTION_HEADING}>Evidence</h3>
              <ul className="list-disc pl-5 space-y-2 text-ink">
                {card.evidence.map((evidence, index) => (
                  <li key={`${evidence.indicatorId}-${index}`} className="leading-relaxed">
                    <span>{evidence.text}</span>
                    {evidence.days.length > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleEvidenceDays(index)}
                          className="text-xs font-semibold text-instrument hover:underline min-h-[44px]"
                        >
                          {expandedEvidence[index] ? 'Hide days' : 'Show days'}
                        </button>
                        {expandedEvidence[index] && (
                          <span className="text-xs text-ink-soft block tabular-nums">
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

          <div className="pl-5 pr-4 py-3">
            <h3 className={SECTION_HEADING}>What we do not know</h3>
            <p className="text-ink mb-3">{card.uncertainty.statement}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-ink-soft">Evidence strength:</span>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`w-4 h-2 rounded-sm ${
                      segment <= filledSegments ? 'bg-instrument' : 'bg-ceramic'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-ink capitalize">
                {card.uncertainty.tier}
              </span>
            </div>

            {card.uncertainty.missingInfo.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-ink-soft block mb-1">
                  Open questions:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-ink-soft">
                  {card.uncertainty.missingInfo.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {card.recommendedActions.length > 0 && (
            <div className="pl-5 pr-4 py-3">
              <h3 className={SECTION_HEADING}>Do now</h3>
              <ol className="list-decimal pl-5 space-y-2 text-ink">
                {card.recommendedActions.map((action, index) => (
                  <li key={`${card.id}-${action.id}-${index}`} className="leading-relaxed">
                    {action.supplyAvailable ? (
                      <span>{action.text}</span>
                    ) : (
                      <span>
                        <span>{action.alternativeText ?? action.text}</span>{' '}
                        {action.requiresSupply && (
                          <span className="inline-block text-xs font-medium px-2 py-0.5 bg-status-watch-soft text-status-watch border border-status-watch rounded-chip ml-1">
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
            <div className="pl-5 pr-4 py-3">
              <h3 className={SECTION_HEADING}>Measure next</h3>
              <ul className="list-disc pl-5 space-y-1 text-ink">
                {card.nextMeasurements.map((measurement, index) => (
                  <li key={index}>{measurement}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pl-5 pr-4 py-3">
            <h3 className={SECTION_HEADING}>Who to contact</h3>
            <p className="text-ink font-medium leading-relaxed">{card.escalation.text}</p>
            {card.escalation.expectedReplyMinutes !== null && (
              <p className="text-xs text-ink-soft mt-1">
                Reply expected in at least {card.escalation.expectedReplyMinutes} minutes.
              </p>
            )}
          </div>

          <div className="pl-5 pr-4 py-3 bg-ceramic/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-ink-soft">
              <span className="font-semibold">Sources: </span>
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
                        className="text-instrument underline hover:opacity-80"
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
                className="px-3 py-1.5 bg-panel border border-line hover:bg-ceramic text-ink text-xs font-bold rounded-input min-h-[44px] flex-shrink-0"
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
