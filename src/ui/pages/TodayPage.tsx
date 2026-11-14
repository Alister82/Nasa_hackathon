import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { DomainId, FindingKind, IndicatorId, IndicatorStatus } from '@/contracts/types';
import { DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { DEFAULT_VIEW_DAY, MISSION_DAYS } from '@/contracts/constants';
import { BodyMap } from '@/ui/components/BodyMap';
import { BodyFigure } from '@/ui/components/BodyFigure';
import { DomainRow } from '@/ui/components/DomainRow';
import { TimelineScrubber, type ScrubberMarker } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { MetricTile } from '@/ui/components/MetricTile';
import { StatusPill } from '@/ui/components/StatusPill';
import { useAppState } from '@/app/AppState';
import { SOURCES } from '@/guidance';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

interface TodayPageProps {
  initialDay?: number;
}

function indicatorText(
  analysis: NonNullable<ReturnType<typeof useAppState>['analysis']>,
  id: IndicatorId,
): string {
  const meta = INDICATORS.find((candidate) => candidate.id === id);
  const indicator = analysis.indicators[id];
  if (!meta || !indicator) return '';
  if (indicator.lastValue === null) return `${meta.label}: no reading`;
  const value = indicator.lastValue.toFixed(meta.decimals);
  const unit = meta.unit.startsWith('score') ? '' : ` ${meta.unit}`;
  const baseline = analysis.baselines[id];
  const baselineText =
    baseline !== undefined
      ? ` (pre-flight ${baseline.median.toFixed(meta.decimals)}${unit})`
      : '';
  return `${meta.label} ${value}${unit}${baselineText}`;
}

function findingLabel(kind: FindingKind): string {
  return kind.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export function TodayPage({ initialDay }: TodayPageProps) {
  const navigate = useNavigate();
  const {
    analysis,
    cards,
    viewDay,
    setViewDay,
    playDemoStory,
    loading,
    loadFailed,
    crewName,
    missionSetting,
  } = useAppState();

  const [isPlayingTimeLapse, setIsPlayingTimeLapse] = useState(false);
  const [bodyViewMode, setBodyViewMode] = useState<'figure' | 'schematic'>('figure');
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    if (initialDay !== undefined) setViewDay(initialDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time-lapse auto-scrubber effect (~160ms per day)
  useEffect(() => {
    if (!isPlayingTimeLapse) return;
    const interval = window.setInterval(() => {
      setViewDay(viewDay >= MISSION_DAYS ? 1 : viewDay + 1);
    }, 160);
    return () => window.clearInterval(interval);
  }, [isPlayingTimeLapse, setViewDay, viewDay]);

  const markers = useMemo<ScrubberMarker[]>(() => {
    if (!analysis) return [];
    const rank: Record<ScrubberMarker['status'], number> = { watch: 1, review: 2, urgent: 3 };
    const byDay = new Map<number, ScrubberMarker>();
    for (const finding of analysis.findings) {
      const status: ScrubberMarker['status'] = finding.urgent
        ? 'urgent'
        : finding.kind === 'isolated_spike' || finding.kind === 'data_quality_issue'
          ? 'watch'
          : 'review';
      const existing = byDay.get(finding.firstFlaggedDay);
      if (!existing || rank[status] > rank[existing.status]) {
        byDay.set(finding.firstFlaggedDay, {
          day: finding.firstFlaggedDay,
          status,
          label: findingLabel(finding.kind),
        });
      }
    }
    return [...byDay.values()].sort((a, b) => a.day - b.day);
  }, [analysis]);

  if (loadFailed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Today</h1>
        <p className="text-ink-soft">
          Could not load simulated crew data. Reload the page to try again.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center" role="status">
        <h1 className="text-2xl font-bold text-ink mb-2">Today</h1>
        <p className="text-ink-soft">
          {loading ? 'Loading simulated crew data...' : 'No crew data is available.'}
        </p>
      </div>
    );
  }

  const summaries: Record<DomainId, string> = {
    cardiovascular: `${indicatorText(analysis, 'heart_rate')}; ${indicatorText(analysis, 'bp_sys')}`,
    sleep_recovery: indicatorText(analysis, 'sleep_hours'),
    physical_performance: indicatorText(analysis, 'exercise_minutes'),
    behavioral: `${indicatorText(analysis, 'mood')}; ${indicatorText(analysis, 'stress')}`,
    metabolic_general: `${indicatorText(analysis, 'body_temp')}; ${indicatorText(analysis, 'glucose')}`,
    radiation: indicatorText(analysis, 'radiation_dose'),
  };

  const domainStatusMap = DOMAIN_ORDER.reduce<Record<DomainId, IndicatorStatus>>((acc, d) => {
    acc[d] = analysis.domains[d].status;
    return acc;
  }, {} as Record<DomainId, IndicatorStatus>);

  const attentionCards = cards.filter((card) => card.severity !== 'info');
  const infoCards = cards.filter((card) => card.severity === 'info');
  const displayedAttentionCards = showAllAlerts ? attentionCards : attentionCards.slice(0, 3);
  const openDomain = (domainId: DomainId) => navigate(`/domain/${domainId}`);

  // Helper for telemetry tiles
  const getTileData = (id: IndicatorId) => {
    const ind = analysis.indicators[id];
    const meta = INDICATORS.find((m) => m.id === id)!;
    const base = analysis.baselines[id];
    const points = ind.points.filter((p) => p.value !== null).map((p) => ({ day: p.day, value: p.value! }));
    const recentPoints = points.slice(-14);
    const lastVal = ind.lastValue;
    const baselineMedian = base?.median;
    const delta = lastVal !== null && baselineMedian !== undefined ? lastVal - baselineMedian : null;

    let status: 'ok' | 'watch' | 'review' | 'urgent' = 'ok';
    if (ind.status === 'flagged') status = 'review';
    else if (ind.status === 'watch') status = 'watch';

    return {
      title: meta.label,
      value: lastVal,
      unit: meta.unit.startsWith('score') ? '' : meta.unit,
      status,
      deltaText: delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(meta.decimals)} from base` : undefined,
      deltaDirection: delta !== null ? (delta > 0 ? ('up' as const) : ('down' as const)) : undefined,
      sparklineValues: recentPoints.map((p) => p.value),
      sparklineBaseline: baselineMedian,
    };
  };

  const hrTile = getTileData('heart_rate');
  const bpSysTile = getTileData('bp_sys');
  const sleepTile = getTileData('sleep_hours');
  const radTile = getTileData('radiation_dose');

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* 1. Situation Summary Hero Banner */}
      <section className="glass-panel p-5 sm:p-6 rounded-3xl border border-line shadow-card relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                Flight Deck • Autonomous Health Operations
              </span>
              <span className="text-xs text-ink-soft">
                Mission setting: <strong className="text-ink font-semibold capitalize">{missionSetting.replace('_', ' ')}</strong>
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Today</h1>
              <p className="text-sm font-semibold text-ink-soft">
                {crewName}, day {viewDay} of {MISSION_DAYS}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {attentionCards.length === 0 ? (
                <>No active findings on day {viewDay}. All physiological domains operating within pre-flight baseline variance.</>
              ) : (
                <span className="text-ink font-medium">
                  {attentionCards.length} finding{attentionCards.length === 1 ? '' : 's'} under review. Traceable decision support grounded in NASA ExMC guidelines.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            <Link
              to="/check"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary text-panel font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all min-h-[44px]"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Start Daily Check</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsPlayingTimeLapse(!isPlayingTimeLapse)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-panel border border-line hover:bg-panel-hover text-ink text-xs font-semibold shadow-sm transition-all min-h-[44px]"
              title={isPlayingTimeLapse ? 'Pause day time-lapse' : 'Play day time-lapse (~160ms/day)'}
            >
              {isPlayingTimeLapse ? (
                <>
                  <Pause className="w-4 h-4 text-accent-primary" />
                  <span>Pause Time-Lapse</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-accent-primary" />
                  <span>Time-Lapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-line/70 overflow-hidden">
          <MetricTile
            title={hrTile.title}
            value={hrTile.value}
            unit={hrTile.unit}
            status={hrTile.status}
            deltaText={hrTile.deltaText}
            deltaDirection={hrTile.deltaDirection}
            sparklineValues={hrTile.sparklineValues}
            sparklineBaseline={hrTile.sparklineBaseline}
            onClick={() => openDomain('cardiovascular')}
          />
          <MetricTile
            title="Systolic BP"
            value={bpSysTile.value}
            unit={bpSysTile.unit}
            status={bpSysTile.status}
            deltaText={bpSysTile.deltaText}
            deltaDirection={bpSysTile.deltaDirection}
            sparklineValues={bpSysTile.sparklineValues}
            sparklineBaseline={bpSysTile.sparklineBaseline}
            onClick={() => openDomain('cardiovascular')}
          />
          <MetricTile
            title={sleepTile.title}
            value={sleepTile.value}
            unit={sleepTile.unit}
            status={sleepTile.status}
            deltaText={sleepTile.deltaText}
            deltaDirection={sleepTile.deltaDirection}
            sparklineValues={sleepTile.sparklineValues}
            sparklineBaseline={sleepTile.sparklineBaseline}
            onClick={() => openDomain('sleep_recovery')}
          />
          <MetricTile
            title="Radiation Rate"
            value={radTile.value}
            unit={radTile.unit}
            status={radTile.status}
            deltaText={radTile.deltaText}
            deltaDirection={radTile.deltaDirection}
            sparklineValues={radTile.sparklineValues}
            sparklineBaseline={radTile.sparklineBaseline}
            onClick={() => openDomain('radiation')}
          />
        </div>
      </section>

      {/* 2. Main Flight Deck Split View */}
      <div className="flex flex-col lg:grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Left Column: Timeline Scrubber + Anatomical Body Map */}
        <section
          aria-label="Astronaut status and mission day"
          className="w-full flex flex-col gap-4 items-center"
        >
          {/* Mission Scrubber with Demo & Play */}
          <div className="w-full order-1 lg:order-2">
            <TimelineScrubber
              day={viewDay}
              maxDay={MISSION_DAYS}
              markers={markers}
              onChange={setViewDay}
              onToday={() => setViewDay(DEFAULT_VIEW_DAY)}
              onPlayDemo={playDemoStory}
            />
          </div>

          {/* Interactive Body Figure & Map Container */}
          <div
            role="group"
            aria-label="Body map"
            className="w-full glass-panel p-5 rounded-3xl border border-line flex flex-col items-center order-2 lg:order-1 shadow-card"
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-line/60">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Physiological Hotspots
              </span>
              <div className="flex items-center gap-1 bg-panel/80 p-0.5 rounded-lg border border-line/60">
                <button
                  type="button"
                  onClick={() => setBodyViewMode('figure')}
                  className={`px-3 py-2 min-h-[44px] min-w-[44px] text-xs font-bold rounded-lg transition-all inline-flex items-center justify-center ${
                    bodyViewMode === 'figure'
                      ? 'bg-accent-primary text-panel shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  Anatomical
                </button>
                <button
                  type="button"
                  onClick={() => setBodyViewMode('schematic')}
                  className={`px-3 py-2 min-h-[44px] min-w-[44px] text-xs font-bold rounded-lg transition-all inline-flex items-center justify-center ${
                    bodyViewMode === 'schematic'
                      ? 'bg-accent-primary text-panel shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  Schematic
                </button>
              </div>
            </div>

            {bodyViewMode === 'figure' ? (
              <div className="w-full flex flex-col items-center">
                <BodyFigure
                  domains={analysis.domains}
                  summaries={summaries}
                  onSelect={openDomain}
                />
                <p className="text-[11px] text-ink-soft/80 mt-2 text-center">
                  Select glowing hotspots to open detailed sensor telemetry.
                </p>
              </div>
            ) : (
              <BodyMap
                domains={analysis.domains}
                summaries={summaries}
                onSelect={openDomain}
              />
            )}
          </div>
        </section>

        {/* Right Column: Health Domains & Active Findings */}
        <section aria-label="Health domains and attention items" className="w-full min-w-0 flex flex-col gap-6">
          {/* Domains Overview Table */}
          <div className="glass-panel rounded-3xl border border-line overflow-hidden shadow-card">
            <div className="px-5 py-4 border-b border-line/80 flex items-center justify-between bg-panel/30">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-primary" />
                <h2 className="font-bold text-base text-ink">Body systems and domains</h2>
              </div>
              <span className="text-xs text-ink-soft font-medium">Select a row for longitudinal charts</span>
            </div>
            <ul className="divide-y divide-line/60">
              {DOMAIN_ORDER.map((domainId) => (
                <DomainRow
                  key={domainId}
                  domain={domainId}
                  analysis={analysis.domains[domainId]}
                  summary={summaries[domainId]}
                  onOpen={openDomain}
                />
              ))}
            </ul>
          </div>

          {/* Attention Items Section */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent-primary" />
                <h2 className="font-bold text-lg text-ink">What needs attention</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-panel border border-line text-ink-soft">
                  {attentionCards.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {attentionCards.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                    className="text-xs font-semibold text-accent-primary hover:underline min-h-[44px] flex items-center"
                  >
                    {showAllAlerts ? 'Show top 3 only' : `See all ${attentionCards.length} findings`}
                  </button>
                )}
                <Link
                  to="/check"
                  className="text-xs sm:text-sm font-semibold text-accent-primary hover:underline inline-flex items-center min-h-[44px]"
                >
                  Log today&apos;s measurements
                </Link>
              </div>
            </div>

            {attentionCards.length === 0 ? (
              <div className="glass-panel border border-line rounded-3xl p-8 text-center shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-accent-teal/10 text-accent-teal flex items-center justify-center mx-auto mb-3 border border-accent-teal/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-ink mb-1">
                  Nothing needs attention on day {viewDay}.
                </h3>
                <p className="text-sm text-ink-soft max-w-md mx-auto mb-4">
                  All physiological telemetry signals remain within your established baseline tolerance limits.
                </p>
                <Link
                  to="/check"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-primary text-panel font-bold text-sm rounded-xl min-h-[44px] shadow-sm hover:opacity-95"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Log today&apos;s measurements</span>
                </Link>
              </div>
            ) : (
              displayedAttentionCards.map((card) => (
                <AlertCardView
                  key={card.id}
                  card={card}
                  sources={SOURCES}
                  onLog={(selected) => navigate('/journal', { state: { card: selected } })}
                />
              ))
            )}

            {infoCards.length > 0 && (
              <details className="mt-2 border border-line rounded-2xl glass-panel overflow-hidden shadow-sm">
                <summary className="px-5 py-3.5 font-bold text-sm text-ink-soft cursor-pointer min-h-[44px] flex items-center justify-between hover:text-ink transition-colors">
                  <span>Expected early spaceflight changes ({infoCards.length})</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-4 pt-0 border-t border-line/60 divide-y divide-line/60">
                  {infoCards.map((card) => (
                    <div key={card.id} className="pt-3">
                      <AlertCardView card={card} sources={SOURCES} />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
