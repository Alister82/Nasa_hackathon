import React, { useState } from 'react';
import type { AlertCard, EvidenceStrength, SeverityLevel, SourceRef } from '@/contracts/types';
import { SUPPLIES } from '@/guidance';
import { StatusChip, type StatusType } from './StatusChip';
import { StatusPill } from './StatusPill';
import { RestTimerWidget } from './RestTimerWidget';
import { BreathingPacerWidget } from './BreathingPacerWidget';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Wind, Activity } from 'lucide-react';

export interface AlertCardViewProps {
  card: AlertCard;
  sources: Record<string, SourceRef>;
  onLog?: (card: AlertCard) => void;
  defaultOpen?: boolean;
}

const SEVERITY_BAR_COLOR: Record<SeverityLevel, string> = {
  urgent: 'bg-status-urgent shadow-[0_0_12px_rgba(239,68,68,0.5)]',
  review: 'bg-status-review shadow-[0_0_12px_rgba(245,158,11,0.5)]',
  watch: 'bg-status-watch shadow-[0_0_8px_rgba(59,130,246,0.3)]',
  info: 'bg-status-info shadow-[0_0_8px_rgba(16,185,129,0.3)]',
};

function mapSeverityToStatus(severity: SeverityLevel): StatusType {
  return severity;
}

function supplyLabel(id: string): string {
  return SUPPLIES.find((supply) => supply.id === id)?.label ?? id.replace(/_/g, ' ');
}

const SECTION_HEADING = 'text-sm font-bold text-ink-soft mb-1 flex items-center gap-1.5';

export function AlertCardView({ card, sources, onLog, defaultOpen }: AlertCardViewProps) {
  const isDefaultOpen = defaultOpen ?? (card.severity === 'review' || card.severity === 'urgent');
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showBreathingPacer, setShowBreathingPacer] = useState(false);
  const [showSupporting, setShowSupporting] = useState(true);

  const tierSegments: Record<EvidenceStrength, number> = { low: 1, moderate: 2, high: 3 };
  const filledSegments = tierSegments[card.uncertainty.tier] ?? 1;

  const toggleEvidenceDays = (index: number) => {
    setExpandedEvidence((previous) => ({ ...previous, [index]: !previous[index] }));
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  return (
    <article
      className="glass-panel rounded-2xl border border-line shadow-card relative overflow-hidden mb-4 transition-all duration-200"
      aria-labelledby={`card-title-${card.id}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${SEVERITY_BAR_COLOR[card.severity]}`}
        aria-hidden="true"
      />

      <div className="pl-5 pr-4 py-3.5 flex items-center justify-between gap-3 border-b border-line/70 flex-wrap bg-panel/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusChip status={mapSeverityToStatus(card.severity)} />
          <h2 id={`card-title-${card.id}`} className="font-bold text-base sm:text-lg text-ink tracking-tight">
            {card.title}
          </h2>
          {card.kind === 'multi_signal_pattern' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Consolidated cluster
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-ink-soft tabular-nums bg-panel/60 px-2 py-0.5 rounded-md border border-line/60">
            Day {card.day}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold text-accent-primary hover:underline p-1 min-h-[44px] min-w-[44px] inline-flex items-center gap-1"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show details</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="pl-5 pr-4 py-3.5 bg-panel/20">
        <h3 className={SECTION_HEADING}>What changed</h3>
        <p className="text-sm sm:text-base text-ink leading-relaxed">{card.observation}</p>

        {/* Supporting Signals for Multi-Signal Pattern */}
        {card.supportingSignals && card.supportingSignals.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-line/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent-primary" />
                Contributing signals ({card.supportingSignals.length})
              </span>
              <button
                type="button"
                onClick={() => setShowSupporting(!showSupporting)}
                className="text-xs text-ink-soft hover:text-ink font-medium min-h-[44px] min-w-[44px] inline-flex items-center px-2"
              >
                {showSupporting ? 'Hide signals' : 'Show signals'}
              </button>
            </div>
            {showSupporting && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1.5">
                {card.supportingSignals.map((sig) => (
                  <div
                    key={sig.indicatorId}
                    className="p-2.5 rounded-xl bg-panel/60 border border-line/60 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{sig.name}</span>
                      <StatusPill status={sig.severity === 'review' ? 'review' : 'watch'} size="sm" />
                    </div>
                    <div className="text-ink-soft flex items-baseline gap-1 mt-0.5">
                      <span className="font-bold text-ink tabular-nums text-sm">
                        {sig.currentValue !== undefined ? sig.currentValue : '—'}
                      </span>
                      {sig.unit && <span>{sig.unit}</span>}
                      {sig.baselineMean !== undefined && (
                        <span className="text-[11px] text-ink-soft ml-auto tabular-nums">
                          base {sig.baselineMean}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-soft/90 line-clamp-1">{sig.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="divide-y divide-line/70 border-t border-line/70 text-sm sm:text-base">
          {card.evidence.length > 0 && (
            <div className="pl-5 pr-4 py-3.5 bg-panel/10">
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
                          className="text-xs font-semibold text-accent-primary hover:underline min-h-[44px]"
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

          <div className="pl-5 pr-4 py-3.5 bg-panel/15">
            <h3 className={SECTION_HEADING}>What we do not know</h3>
            <p className="text-ink mb-3 leading-relaxed">{card.uncertainty.statement}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-ink-soft">Evidence strength:</span>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`w-4 h-2 rounded-sm ${
                      segment <= filledSegments ? 'bg-accent-primary shadow-[0_0_6px_rgba(59,130,246,0.4)]' : 'bg-ceramic'
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
            <div className="pl-5 pr-4 py-3.5 bg-panel/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className={SECTION_HEADING}>Do now</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {card.hasRestTimer && (
                    <button
                      type="button"
                      onClick={() => setShowRestTimer(!showRestTimer)}
                      className="text-xs font-semibold px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {showRestTimer ? 'Hide rest timer' : 'Open 5m rest timer'}
                    </button>
                  )}
                  {card.hasBreathingPacer && (
                    <button
                      type="button"
                      onClick={() => setShowBreathingPacer(!showBreathingPacer)}
                      className="text-xs font-semibold px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal border border-accent-teal/20 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Wind className="w-3.5 h-3.5" />
                      {showBreathingPacer ? 'Hide breathing pacer' : 'Open 4s/6s pacer'}
                    </button>
                  )}
                </div>
              </div>

              {/* Embedded Procedure Widgets */}
              {showRestTimer && (
                <div className="mb-4 p-3 bg-panel/80 rounded-xl border border-line/80 shadow-inner">
                  <RestTimerWidget onComplete={() => setCompletedSteps((prev) => ({ ...prev, rest: true }))} />
                </div>
              )}

              {showBreathingPacer && (
                <div className="mb-4 p-3 bg-panel/80 rounded-xl border border-line/80 shadow-inner">
                  <BreathingPacerWidget onComplete={() => setCompletedSteps((prev) => ({ ...prev, breathing: true }))} />
                </div>
              )}

              <ol className="list-decimal pl-5 space-y-2.5 text-ink">
                {card.recommendedActions.map((action, index) => {
                  const stepKey = `${card.id}-${action.id}-${index}`;
                  const isDone = completedSteps[stepKey];
                  return (
                    <li key={stepKey} className="leading-relaxed">
                      <div className="flex items-start gap-1">
                        <button
                          type="button"
                          onClick={() => toggleStep(stepKey)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center -ml-2 -mt-2 p-2 text-ink-soft hover:text-accent-primary transition-colors flex-shrink-0"
                          title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                          aria-label={`Toggle step: ${action.text}`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              isDone ? 'text-accent-teal fill-accent-teal/20' : 'text-ink-soft/40'
                            }`}
                          />
                        </button>
                        <span className={`pt-2.5 ${isDone ? 'line-through text-ink-soft' : ''}`}>
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
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {card.nextMeasurements.length > 0 && (
            <div className="pl-5 pr-4 py-3.5 bg-panel/10">
              <h3 className={SECTION_HEADING}>Measure next</h3>
              <ul className="list-disc pl-5 space-y-1 text-ink">
                {card.nextMeasurements.map((measurement, index) => (
                  <li key={index}>{measurement}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pl-5 pr-4 py-3.5 bg-panel/20">
            <h3 className={SECTION_HEADING}>Who to contact</h3>
            <p className="text-ink font-medium leading-relaxed">{card.escalation.text}</p>
            {card.escalation.expectedReplyMinutes !== null && (
              <p className="text-xs text-ink-soft mt-1">
                Reply expected in at least {card.escalation.expectedReplyMinutes} minutes.
              </p>
            )}
          </div>

          <div className="pl-5 pr-4 py-3 bg-panel/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                        className="text-accent-primary underline hover:opacity-80 inline-flex items-center min-h-[44px]"
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
                className="px-3.5 py-1.5 bg-panel border border-line hover:bg-panel-hover text-ink text-xs font-bold rounded-xl min-h-[44px] flex-shrink-0 shadow-sm transition-all"
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
