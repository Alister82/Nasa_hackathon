import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DomainId, FindingKind, IndicatorId, IndicatorStatus } from '@/contracts/types';
import { DOMAIN_ORDER, INDICATORS, DOMAIN_LABELS } from '@/contracts/indicators';
import { DEFAULT_VIEW_DAY, MISSION_DAYS } from '@/contracts/constants';
import { BodyMap } from '@/ui/components/BodyMap';
import { TimelineScrubber, type ScrubberMarker } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { useAppState } from '@/app/AppState';
import { SOURCES } from '@/guidance';
import {
  SectionCard, CardHeader, PageHeader, MetricCard,
  EmptyState, LoadingState, PrimaryButton, SeverityBadge,
} from '@/ui/components/PremiumComponents';

interface TodayPageProps { initialDay?: number; }

function indicatorText(
  analysis: NonNullable<ReturnType<typeof useAppState>['analysis']>,
  id: IndicatorId,
): string {
  const meta = INDICATORS.find((c) => c.id === id);
  const indicator = analysis.indicators[id];
  if (!meta || !indicator) return '';
  if (indicator.lastValue === null) return `${meta.label}: no reading`;
  const value = indicator.lastValue.toFixed(meta.decimals);
  const unit = meta.unit.startsWith('score') ? '' : ` ${meta.unit}`;
  const baseline = analysis.baselines[id];
  const baselineText = baseline !== undefined
    ? ` (pre-flight ${baseline.median.toFixed(meta.decimals)}${unit})`
    : '';
  return `${meta.label} ${value}${unit}${baselineText}`;
}

function findingLabel(kind: FindingKind): string {
  return kind.replace(/_/g, ' ').replace(/^./, (l) => l.toUpperCase());
}

function domainStatusToIndicatorStatus(ds: string): IndicatorStatus {
  if (ds === 'flagged') return 'flagged';
  if (ds === 'watch')   return 'watch';
  return 'ok';
}

/** Map indicator id to its latest value + status for the metric grid */
function getMetricGridData(
  analysis: NonNullable<ReturnType<typeof useAppState>['analysis']>,
) {
  const ids: IndicatorId[] = ['heart_rate', 'bp_sys', 'body_temp', 'glucose', 'sleep_hours', 'exercise_minutes'];
  return ids.map((id) => {
    const meta      = INDICATORS.find((m) => m.id === id)!;
    const indicator = analysis.indicators[id];
    const lastValue = indicator?.lastValue ?? null;
    const baseline  = analysis.baselines[id];
    const formatted = lastValue !== null ? lastValue.toFixed(meta.decimals) : null;
    const baselineFmt = baseline ? baseline.median.toFixed(meta.decimals) : undefined;

    // Determine status from domain
    const domain   = analysis.domains[meta.domain];
    const domSt    = domainStatusToIndicatorStatus(domain?.status ?? 'ok');

    return { id, label: meta.label, unit: meta.unit, value: formatted, status: domSt, baseline: baselineFmt };
  });
}

export function TodayPage({ initialDay }: TodayPageProps) {
  const navigate = useNavigate();
  const {
    analysis, cards, viewDay, setViewDay,
    playDemoStory, loading, loadFailed, crewName,
  } = useAppState();

  useEffect(() => {
    if (initialDay !== undefined) setViewDay(initialDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markers = useMemo<ScrubberMarker[]>(() => {
    if (!analysis) return [];
    const rank: Record<ScrubberMarker['status'], number> = { watch: 1, review: 2, urgent: 3 };
    const byDay = new Map<number, ScrubberMarker>();
    for (const finding of analysis.findings) {
      const status: ScrubberMarker['status'] = finding.urgent ? 'urgent'
        : finding.kind === 'isolated_spike' || finding.kind === 'data_quality_issue' ? 'watch'
        : 'review';
      const existing = byDay.get(finding.firstFlaggedDay);
      if (!existing || rank[status] > rank[existing.status]) {
        byDay.set(finding.firstFlaggedDay, { day: finding.firstFlaggedDay, status, label: findingLabel(finding.kind) });
      }
    }
    return [...byDay.values()].sort((a, b) => a.day - b.day);
  }, [analysis]);

  if (loadFailed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon="⚠️"
          title="Could not load crew data"
          body="Reload the page to try again. All data is generated locally."
          action={<PrimaryButton onClick={() => window.location.reload()}>Reload</PrimaryButton>}
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <LoadingState label={loading ? 'Generating crew simulation…' : 'No crew data available'} />
      </div>
    );
  }

  const summaries: Record<DomainId, string> = {
    cardiovascular:       `${indicatorText(analysis, 'heart_rate')}; ${indicatorText(analysis, 'bp_sys')}`,
    sleep_recovery:       indicatorText(analysis, 'sleep_hours'),
    physical_performance: indicatorText(analysis, 'exercise_minutes'),
    behavioral:           `${indicatorText(analysis, 'mood')}; ${indicatorText(analysis, 'stress')}`,
    metabolic_general:    `${indicatorText(analysis, 'body_temp')}; ${indicatorText(analysis, 'glucose')}`,
    radiation:            indicatorText(analysis, 'radiation_dose'),
  };

  const attentionCards = cards.filter((c) => c.severity !== 'info');
  const infoCards      = cards.filter((c) => c.severity === 'info');
  const openDomain     = (domainId: DomainId) => navigate(`/domain/${domainId}`);
  const metricData     = getMetricGridData(analysis);

  const overallOk = attentionCards.length === 0;

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6">

      {/* ── Page header ── */}
      <PageHeader
        title="Mission Dashboard"
        subtitle={`${crewName} · Day ${viewDay} of ${MISSION_DAYS} · ${overallOk ? 'All domains nominal' : `${attentionCards.length} item${attentionCards.length !== 1 ? 's' : ''} need attention`}`}
        actions={
          <>
            <Link
              to="/log"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-semibold bg-bg-surface border border-border text-ink hover:bg-bg-surface-3 transition-colors min-h-[44px]"
            >
              Log Measurements
            </Link>
            <Link
              to="/checkin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors min-h-[44px]"
            >
              Run Check-in
            </Link>
          </>
        }
      />

      {/* ── Timeline scrubber ── */}
      <SectionCard className="mb-6" noPad>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold text-ink">Mission Timeline</h2>
            <span className="text-xs text-ink-soft">Mission Duration: {MISSION_DAYS} Days</span>
          </div>
        </div>
        <div className="p-4">
          <TimelineScrubber
            day={viewDay}
            maxDay={MISSION_DAYS}
            markers={markers}
            onChange={setViewDay}
            onToday={() => setViewDay(DEFAULT_VIEW_DAY)}
            onPlayDemo={playDemoStory}
          />
        </div>
      </SectionCard>

      {/* ── Key metric grid ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>Key Health Metrics</h2>
          <Link to="/log" className="text-xs font-medium text-accent hover:underline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metricData.map((m) => (
            <MetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              unit={m.unit.startsWith('score') ? '' : m.unit}
              status={m.status === 'flagged' ? 'review' : m.status}
              baseline={m.baseline ? `${m.baseline} ${m.unit.startsWith('score') ? '' : m.unit}` : undefined}
              onClick={() => navigate(`/domain/${INDICATORS.find(i => i.id === m.id)?.domain}`)}
            />
          ))}
        </div>
      </div>

      {/* ── Main content grid: Body map + Domains / Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        {/* Left column: Body map */}
        <div className="flex flex-col gap-4">
          <SectionCard noPad>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Body Health Overview</h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-status-ok">
                <span className="w-1.5 h-1.5 rounded-full bg-status-ok" aria-hidden="true" />
                Live
              </span>
            </div>
            <div className="flex flex-col items-center px-4 py-4">
              <BodyMap
                domains={analysis.domains}
                summaries={summaries}
                onSelect={openDomain}
              />
            </div>
          </SectionCard>

          {/* Domain status list */}
          <SectionCard noPad>
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-ink">Body systems and domains</h2>
            </div>
            <ul className="divide-y divide-border" role="list">
              {DOMAIN_ORDER.map((domainId) => {
                const dom    = analysis.domains[domainId];
                const status = domainStatusToIndicatorStatus(dom?.status ?? 'ok');
                const statusStyles = {
                  ok:     { dot: 'bg-status-ok',     label: 'Nominal', text: 'text-status-ok' },
                  watch:  { dot: 'bg-status-watch',  label: 'Watch',   text: 'text-status-watch' },
                  flagged:{ dot: 'bg-status-review', label: 'Review',  text: 'text-status-review' },
                };
                const st = statusStyles[status];
                return (
                  <li key={domainId}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-surface-2 transition-colors min-h-[52px] text-left"
                      onClick={() => openDomain(domainId)}
                      aria-label={`${DOMAIN_LABELS[domainId]}: ${st.label}. View details.`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} aria-hidden="true" />
                      <span className="flex-1 text-sm font-medium text-ink">{DOMAIN_LABELS[domainId]}</span>
                      <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
                      <span className="text-ink-muted">›</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

        {/* Right column: Alerts + Quick actions */}
        <div className="flex flex-col gap-6">

          {/* Alert overview */}
          <SectionCard noPad>
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">What needs attention</h2>
                {attentionCards.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-review text-white text-[10px] font-bold">
                    {attentionCards.length}
                  </span>
                )}
              </div>
              <Link
                to="/log"
                className="text-xs font-medium text-accent hover:underline min-h-[44px] inline-flex items-center"
              >
                Log measurements →
              </Link>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {attentionCards.length === 0 ? (
                <EmptyState
                  icon="✅"
                  title={`All nominal on day ${viewDay}`}
                  body="No indicators need attention right now. Keep logging your daily measurements."
                  action={
                    <Link to="/log" className="inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-semibold bg-accent text-white hover:bg-accent-hover min-h-[44px]">
                      Log Measurements
                    </Link>
                  }
                />
              ) : (
                attentionCards.map((card) => (
                  <div key={card.id} className="border border-border rounded-card overflow-hidden">
                    <div className={`px-4 py-2 flex items-center gap-2 ${card.severity === 'urgent' ? 'bg-status-urgent/8' : 'bg-status-review/5'}`}>
                      <SeverityBadge severity={card.severity as 'info' | 'review' | 'urgent'} />
                      <span className="text-sm font-semibold text-ink flex-1">{card.title}</span>
                    </div>
                    <div className="p-1">
                      <AlertCardView
                        card={card}
                        sources={SOURCES}
                        onLog={(selected) => navigate('/journal', { state: { card: selected } })}
                      />
                    </div>
                  </div>
                ))
              )}

              {infoCards.length > 0 && (
                <details className="border border-border rounded-card overflow-hidden">
                  <summary className="px-4 py-3 font-semibold text-sm text-ink-soft cursor-pointer min-h-[44px] flex items-center hover:bg-bg-surface-2 transition-colors">
                    Expected adaptations ({infoCards.length})
                  </summary>
                  <div className="border-t border-border divide-y divide-border">
                    {infoCards.map((card) => (
                      <div key={card.id} className="p-4">
                        <AlertCardView card={card} sources={SOURCES} />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </SectionCard>

          {/* Quick actions */}
          <SectionCard>
            <CardHeader title="Quick Actions" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { to: '/log',     emoji: '📊', label: 'Log Measurements', desc: 'Record today\'s vitals' },
                { to: '/checkin', emoji: '💬', label: 'Wellbeing Check-in', desc: 'Report mood & energy' },
                { to: '/journal', emoji: '📋', label: 'Investigation Journal', desc: 'Log actions & observations' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col gap-1 p-3 rounded-card border border-border hover:border-accent/40 hover:bg-accent-soft/30 transition-all duration-150 group min-h-[80px]"
                >
                  <span className="text-xl" aria-hidden="true">{action.emoji}</span>
                  <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">{action.label}</span>
                  <span className="text-xs text-ink-soft">{action.desc}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
