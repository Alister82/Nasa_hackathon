import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  AlertOctagon,
  Bookmark,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  ExternalLink,
  FlaskConical,
  Stethoscope,
  Pill,
  Radio,
  X,
} from '@/ui/components/icons';
import type { AlertCard, AnalysisResult, EvidenceStrength, MissionSettingId, SeverityLevel, SourceRef, SupplyId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { MISSION_SETTINGS, SUPPLIES } from '@/guidance';
import { SeverityMark } from './SeverityMark';
import { cn } from '@/ui/lib/format';

export interface AlertCardViewProps {
  card: AlertCard;
  sources: Record<string, SourceRef>;
  onLog?: (card: AlertCard) => void;
  defaultOpen?: boolean;
  detailMode?: boolean;
  modalOnExpand?: boolean;
  onClose?: () => void;
  telemetry?: {
    missionSetting: MissionSettingId;
    analysis: AnalysisResult;
    supplies: Record<SupplyId, boolean>;
  };
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
  'flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-faint mb-2';

function supplyLabel(id: string): string {
  return SUPPLIES.find((supply) => supply.id === id)?.label ?? id.replace(/_/g, ' ');
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function AlertCardView({ card, sources, onLog, defaultOpen, detailMode, modalOnExpand, onClose, telemetry }: AlertCardViewProps) {
  const isDefaultOpen = modalOnExpand ? false : defaultOpen ?? (card.severity === 'review' || card.severity === 'urgent');
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [packetOpen, setPacketOpen] = useState(false);
  const showDetails = detailMode || isOpen;
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const tierSegments: Record<EvidenceStrength, number> = { low: 1, moderate: 2, high: 3 };
  const filledSegments = tierSegments[card.uncertainty.tier] ?? 1;
  const style = SEVERITY_STYLES[card.severity];
  const panelId = `card-panel-${card.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const titleId = `card-title-${card.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const rawId = useId().replace(/:/g, '');
  const modalRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const setting = telemetry ? MISSION_SETTINGS[telemetry.missionSetting] : null;
  const supplyActions = card.recommendedActions.filter((action) => action.requiresSupply);
  const trajectoryRows = telemetry
    ? card.indicators.map((indicatorId) => {
        const meta = INDICATORS.find((candidate) => candidate.id === indicatorId);
        const baseline = telemetry.analysis.baselines[indicatorId];
        const indicator = telemetry.analysis.indicators[indicatorId];
        const points = (indicator?.points ?? []).filter((point) => point.day <= card.day).slice(-7);
        if (!meta) return null;
        const observed = mean(points.flatMap((point) => point.value === null ? [] : [point.value]));
        const expected = mean(points.map((point) => point.expected));
        const format = (value: number | null | undefined) => value == null ? '—' : `${value.toFixed(meta.decimals)} ${meta.unit}`;
        return { indicatorId, label: meta.label, baseline: format(baseline?.median), observed: format(observed), expected: format(expected) };
      }).filter((row): row is NonNullable<typeof row> => row !== null)
    : [];

  const toggleEvidenceDays = (index: number) => {
    setExpandedEvidence((previous) => ({ ...previous, [index]: !previous[index] }));
  };

  useEffect(() => {
    if (!modalOnExpand || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      tileRef.current?.focus();
    };
  }, [modalOnExpand, isOpen]);

  if (modalOnExpand) {
    return (
      <>
        <button
          ref={tileRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'group relative flex min-h-[170px] w-full flex-col overflow-hidden rounded-[16px] border bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-px hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-instrument focus-visible:ring-offset-2',
            card.severity === 'urgent' ? 'border-status-urgent/35' : card.severity === 'review' ? 'border-status-review/30' : 'border-line',
          )}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`Open alert details: ${card.title}`}
        >
          <span className="relative flex w-full items-center justify-between gap-2">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <SeverityMark severity={card.severity} />
              <span className={cn('chip', style.soft, style.text, 'capitalize')}>{style.label}</span>
              <span className="text-[0.62rem] font-semibold text-ink-faint">Day {card.day}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-instrument" aria-hidden="true" />
          </span>
          <span className="relative mt-3 font-display text-[0.94rem] font-semibold leading-snug text-ink">{card.title}</span>
          <span className="relative mt-1 line-clamp-2 text-[0.72rem] leading-relaxed text-ink-soft">{card.observation}</span>
          <span className="relative mt-auto flex flex-wrap gap-x-1 pt-3 text-[0.6rem] font-medium capitalize text-ink-faint">
            {card.domains.map((domain, index) => <React.Fragment key={domain}>{index > 0 && <span>·</span>}{domain.replace(/_/g, ' ')}</React.Fragment>)}
            <span className="ml-auto font-semibold text-instrument">Open details</span>
          </span>
        </button>
        {isOpen && createPortal(
          <div
            className="attention-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-3 sm:p-6"
            onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Alert details: ${card.title}`}
              tabIndex={-1}
              className="attention-dialog max-h-[92dvh] w-[min(820px,100%)] overflow-y-auto rounded-[18px] border border-black/[0.07] bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.35)]"
            >
              <AlertCardView
                card={card}
                sources={sources}
                onLog={onLog}
                telemetry={telemetry}
                detailMode
                defaultOpen
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  return (
    <>
    <article
      className={cn(
        'group relative overflow-hidden rounded-[16px] border bg-white shadow-card transition-shadow',
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
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
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
            <h2 id={titleId} className="mt-1 font-display text-[0.95rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
              {card.title}
            </h2>
          </div>
        </div>
        {!detailMode && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-[0.66rem] font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            aria-expanded={isOpen}
            aria-controls={panelId}
          >
            {isOpen ? 'Collapse' : 'Show details'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="Close alert details">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        <h3 className={SECTION_HEADING}>
          <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
          What changed
        </h3>
        <p className="text-[0.8rem] leading-relaxed text-ink-2">{card.observation}</p>
      </div>

      {showDetails && (
        <div id={panelId} className="border-t border-line/80">
          <section className="border-b border-line/80 bg-instrument-soft/25 px-4 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={SECTION_HEADING.replace('mb-2', 'mb-0')}>
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Flight Procedure / Syndrome Console
              </h3>
              <span className="chip chip-primary">CMO Procedure Mode: Guided Non-Physician Protocol</span>
            </div>
            <p className="mt-2 text-[0.66rem] leading-relaxed text-ink-soft">
              CMO Cognitive Load (display metric): {card.recommendedActions.length} guided action{card.recommendedActions.length === 1 ? '' : 's'} · {card.nextMeasurements.length} next-measurement item{card.nextMeasurements.length === 1 ? '' : 's'}. This is a count of on-screen steps, not a validated workload score.
            </p>
            <div className="mt-3 rounded-xl border border-line/80 bg-white p-3">
              <h4 className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">Consumable Resource Impact</h4>
              {supplyActions.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {supplyActions.map((action) => (
                    <li key={action.id} className="text-[0.7rem] leading-relaxed text-ink-2">
                      {action.supplyAvailable ? 'Required by listed action: ' : 'Not listed aboard: '}
                      <span className="font-semibold">{supplyLabel(action.requiresSupply!)}</span>
                      {!action.supplyAvailable && action.alternativeText ? ` · ${action.alternativeText}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-2">
                  No supply in the onboard inventory is explicitly required by this card&apos;s actions.
                </p>
              )}
              {card.kind === 'isolated_spike' && (
                <p className="mt-1.5 text-[0.66rem] leading-relaxed text-ink-soft">
                  An isolated spike is not classified as a motion artifact by this prototype. It does not automatically spend a test strip; follow the listed confirmation step. Disposable strip counts are not modeled.
                </p>
              )}
              <p className="mt-1.5 text-[0.62rem] text-ink-faint">Device inventory is shown; hardware health and remaining consumable quantities are not instrumented.</p>
            </div>
            {telemetry && (
              <button
                type="button"
                onClick={() => setPacketOpen(true)}
                className="btn btn-secondary mt-3 !min-h-[40px] !px-3 !text-[0.68rem]"
              >
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Build Flight Surgeon Telemetry Downlink Packet
              </button>
            )}
          </section>

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
              <span className="text-[0.62rem] font-semibold capitalize text-ink">{card.uncertainty.tier}</span>
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
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-instrument-soft text-[0.56rem] font-semibold text-instrument-deep tabular-nums">
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
                      <span>{title}</span>
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
    {packetOpen && telemetry && setting && createPortal(
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 sm:p-6"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setPacketOpen(false); }}
      >
        <section role="dialog" aria-modal="true" aria-labelledby={`downlink-title-${rawId}`} className="flex max-h-[92dvh] w-[min(820px,100%)] flex-col overflow-hidden rounded-[18px] border border-black/[0.07] bg-white shadow-float">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="section-kicker">Draft · not transmitted</p>
              <h2 id={`downlink-title-${rawId}`} className="font-display text-[0.95rem] font-semibold text-ink">Flight Surgeon Telemetry Downlink Packet</h2>
            </div>
            <button type="button" onClick={() => setPacketOpen(false)} className="icon-btn" aria-label="Close telemetry packet">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="scroll-thin space-y-3 overflow-y-auto p-4">
            <section className="rounded-xl border border-line p-3">
              <h3 className="text-[0.7rem] font-semibold text-ink">Vehicle &amp; OWLT (One-Way Light Time)</h3>
              <p className="mt-1 text-[0.72rem] text-ink-2">{setting.label} · {setting.oneWayDelayMinutes === 0 ? '0 min (near-real-time link)' : setting.oneWayDelayMinutes < 1 ? `${(setting.oneWayDelayMinutes * 60).toFixed(1)} sec` : `${setting.oneWayDelayMinutes} min`} one way. Vehicle/habitat identifier is not configured.</p>
            </section>

            <section className="rounded-xl border border-line p-3">
              <h3 className="text-[0.7rem] font-semibold text-ink">Crew Baseline vs. 7-Day Adaptation-Adjusted Trajectory</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="data-table min-w-[560px]">
                  <thead><tr><th>Measure</th><th>Pre-flight baseline</th><th>7-day expected adaptation</th><th>7-day observed mean</th></tr></thead>
                  <tbody>{trajectoryRows.map((row) => (
                    <tr key={row.indicatorId}><td>{row.label}</td><td>{row.baseline}</td><td>{row.expected}</td><td>{row.observed}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              {trajectoryRows.length === 0 && <p className="mt-1 text-[0.68rem] text-ink-soft">No indicator trajectory is attached to this card.</p>}
              <p className="mt-1 text-[0.62rem] text-ink-faint">Expected values are simulator adaptation curves, not validated clinical forecasts.</p>
            </section>

            <section className="rounded-xl border border-line p-3">
              <h3 className="text-[0.7rem] font-semibold text-ink">CUSUM Onset &amp; Cross-Domain Syndrome Cluster</h3>
              <p className="mt-1 text-[0.68rem] text-ink-2">Domains: {card.domains.join(', ') || 'none recorded'} · Finding: {card.kind} · Alert day: {card.day}</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {card.indicators.map((id) => {
                  const meta = INDICATORS.find((candidate) => candidate.id === id);
                  const result = telemetry.analysis.indicators[id];
                  if (!meta || !result) return null;
                  return <li key={id} className="text-[0.66rem] text-ink-soft">{meta.label}: onset {result.onsetDay ?? 'none'} · CUSUM ↑ {result.cusumUp.toFixed(2)} / ↓ {result.cusumDown.toFixed(2)}</li>;
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-line p-3">
              <h3 className="text-[0.7rem] font-semibold text-ink">Onboard Consumables &amp; Hardware Status</h3>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {SUPPLIES.map((supply) => <li key={supply.id} className="text-[0.66rem] text-ink-soft">{supply.label}: {telemetry.supplies[supply.id] ? 'aboard' : 'not marked aboard'}</li>)}
              </ul>
              <p className="mt-1 text-[0.62rem] text-ink-faint">Consumable quantities and hardware diagnostics are not available in this prototype.</p>
            </section>

            <section className="rounded-xl border border-line p-3">
              <h3 className="text-[0.7rem] font-semibold text-ink">CMO Actions Executed Prior to Ground Reply</h3>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-ink-2">No completed action record is attached to this alert. The card&apos;s recommended actions are guidance and are not represented as executed.</p>
            </section>
          </div>
        </section>
      </div>,
      document.body,
    )}
    </>
  );
}
