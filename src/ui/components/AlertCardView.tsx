import React, { useState } from 'react';
import type { AlertCard, SourceRef, EvidenceStrength, SeverityLevel } from '@/contracts/types';
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

function mapSeverityToStatus(sev: SeverityLevel): StatusType {
  return sev as StatusType;
}

export function AlertCardView({ card, sources, onLog, defaultOpen }: AlertCardViewProps) {
  // review and urgent cards default open; info/watch default collapsed unless defaultOpen passed
  const isDefaultOpen = defaultOpen ?? (card.severity === 'review' || card.severity === 'urgent');
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  const toggleEvidenceDays = (idx: number) => {
    setExpandedEvidence((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const barColor = SEVERITY_BAR_COLOR[card.severity] ?? 'bg-status-review';
  const statusType = mapSeverityToStatus(card.severity);

  const tierMeterCount: Record<EvidenceStrength, number> = {
    low: 1,
    moderate: 2,
    high: 3,
  };
  const filledSegments = tierMeterCount[card.uncertainty.tier] ?? 1;

  return (
    <article
      className="bg-panel rounded-sheet border border-line shadow-card relative overflow-hidden transition-all duration-150 mb-4"
      aria-labelledby={`card-title-${card.id}`}
    >
      {/* 6 px left bar in severity strong color */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`} aria-hidden="true" />

      {/* 1. Header row */}
      <div className="pl-4 sm:pl-5 pr-4 py-3 flex items-center justify-between gap-3 border-b border-line flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusChip status={statusType} />
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
            className="text-xs font-semibold text-instrument hover:underline p-1 min-h-[44px] min-w-[44px] inline-flex items-center"
            aria-expanded={isOpen}
          >
            {isOpen ? 'Collapse' : 'Show details'}
          </button>
        </div>
      </div>

      {/* 2. What changed (Always visible) */}
      <div className="pl-4 sm:pl-5 pr-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">What changed</h3>
        <p className="text-sm sm:text-base text-ink leading-relaxed">{card.observation}</p>
      </div>

      {/* Details sections when expanded */}
      {isOpen && (
        <div className="divide-y divide-line border-t border-line text-sm sm:text-base">
          {/* 3. Evidence */}
          {card.evidence.length > 0 && (
            <div className="pl-4 sm:pl-5 pr-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Evidence</h3>
              <ul className="list-disc pl-5 space-y-2 text-ink">
                {card.evidence.map((ev, idx) => (
                  <li key={`${ev.indicatorId}-${idx}`} className="leading-relaxed">
                    <span>{ev.text}</span>
                    {ev.days && ev.days.length > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleEvidenceDays(idx)}
                          className="text-xs font-semibold text-instrument hover:underline"
                        >
                          {expandedEvidence[idx] ? 'Hide days' : 'Show days'}
                        </button>
                        {expandedEvidence[idx] && (
                          <span className="text-xs text-ink-soft block mt-0.5 tabular-nums">
                            Observed days: {ev.days.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. What we do not know */}
          <div className="pl-4 sm:pl-5 pr-4 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">What we do not know</h3>
            <p className="text-ink mb-3">{card.uncertainty.statement}</p>

            {/* 3-segment meter for evidence strength */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-ink-soft">Evidence strength:</span>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((seg) => (
                  <span
                    key={seg}
                    className={`w-4 h-2 rounded-sm ${
                      seg <= filledSegments ? 'bg-instrument' : 'bg-ceramic'
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
                <span className="text-xs font-semibold text-ink-soft block mb-1">Open questions:</span>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-ink-soft">
                  {card.uncertainty.missingInfo.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 5. Do now (Numbered list) */}
          {card.recommendedActions.length > 0 && (
            <div className="pl-4 sm:pl-5 pr-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Do now</h3>
              <ol className="list-decimal pl-5 space-y-2 text-ink">
                {card.recommendedActions.map((action, idx) => (
                  <li key={action.id || idx} className="leading-relaxed">
                    {action.supplyAvailable ? (
                      <span>{action.text}</span>
                    ) : (
                      <span>
                        <span>{action.alternativeText ?? action.text}</span>{' '}
                        {action.requiresSupply && (
                          <span className="inline-block text-xs font-medium px-2 py-0.5 bg-status-watch-soft text-status-watch border border-status-watch rounded-chip ml-1">
                            No {action.requiresSupply.replace('_', ' ')} aboard
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 6. Measure next */}
          {card.nextMeasurements && card.nextMeasurements.length > 0 && (
            <div className="pl-4 sm:pl-5 pr-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">Measure next</h3>
              <ul className="list-disc pl-5 space-y-1 text-ink">
                {card.nextMeasurements.map((nm, idx) => (
                  <li key={idx}>{nm}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Who to contact */}
          <div className="pl-4 sm:pl-5 pr-4 py-3 bg-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">Who to contact</h3>
            <p className="text-ink font-medium leading-relaxed">{card.escalation.text}</p>
            {card.escalation.expectedReplyMinutes !== null && (
              <p className="text-xs text-ink-soft mt-1">
                Reply expected in at least {card.escalation.expectedReplyMinutes} minutes.
              </p>
            )}
          </div>

          {/* 8. Footer: Sources & Log Action */}
          <div className="pl-4 sm:pl-5 pr-4 py-3 bg-ceramic/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-ink-soft">
              <span className="font-semibold">Sources: </span>
              {card.sourceIds.map((sid, idx) => {
                const s = sources[sid];
                const title = s?.title ?? sid;
                const isVerified = s?.url && s?.status === 'verified';

                return (
                  <span key={sid}>
                    {idx > 0 && '; '}
                    {isVerified ? (
                      <a
                        href={s.url!}
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
