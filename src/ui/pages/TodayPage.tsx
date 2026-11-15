import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Radio,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  X,
} from 'lucide-react';
import type { AlertCard, DomainId, IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS, DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { MISSION_DAYS } from '@/contracts/constants';
import { MISSION_SETTINGS, SOURCES, expectedReplyMinutes } from '@/guidance';
import { useAppState } from '@/app/AppState';
import { BodyHologram } from '@/ui/components/BodyHologram';
import { DomainRow } from '@/ui/components/DomainRow';
import { TimelineScrubber, type ScrubberMarker } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { SeverityMark } from '@/ui/components/SeverityMark';
import { MetricTile, DOMAIN_VISUALS } from '@/ui/components/MetricTile';
import { RingGauge } from '@/ui/components/Sparkline';
import { TrendChart, type TrendSeriesSpec } from '@/ui/charts/TrendChart';
import { DeltaBadge, PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { buildTimelineData, metricSnapshot, severityLabel, SEVERITY_RANK } from '@/ui/lib/metrics';
import { cn } from '@/ui/lib/format';

interface TodayPageProps {
  initialDay?: number;
}

function shortReading(
  analysis: NonNullable<ReturnType<typeof useAppState>['analysis']>,
  id: IndicatorId,
  suffix = '',
): string {
  const meta = INDICATORS.find((candidate) => candidate.id === id);
  const value = analysis.indicators[id]?.lastValue;
  if (!meta || value === null || value === undefined) return '—';
  return `${value.toFixed(meta.decimals)}${suffix ? ` ${suffix}` : ''}`;
}

const METRIC_DOMAIN: Record<string, DomainId> = {
  heart_rate: 'cardiovascular',
  bp_sys: 'cardiovascular',
  body_temp: 'metabolic_general',
  sleep_hours: 'sleep_recovery',
  exercise_minutes: 'physical_performance',
  stress: 'behavioral',
};

const ATTENTION_TONES: Record<
  AlertCard['severity'],
  { border: string; rail: string; chip: string; glow: string }
> = {
  urgent: {
    border: 'border-status-urgent/30 ring-1 ring-status-urgent/10',
    rail: 'bg-status-urgent',
    chip: 'bg-status-urgent-soft text-status-urgent',
    glow: 'bg-status-urgent',
  },
  review: {
    border: 'border-status-review/25',
    rail: 'bg-status-review',
    chip: 'bg-status-review-soft text-status-review',
    glow: 'bg-status-review',
  },
  watch: {
    border: 'border-status-watch/25',
    rail: 'bg-status-watch',
    chip: 'bg-status-watch-soft text-status-watch',
    glow: 'bg-status-watch',
  },
  info: {
    border: 'border-line',
    rail: 'bg-instrument',
    chip: 'bg-instrument-soft text-instrument',
    glow: 'bg-instrument',
  },
};

const QUICK_ACTIONS = [
  { to: '/log', label: 'Log measurements', hint: 'Enter today’s readings', icon: Stethoscope },
  { to: '/checkin', label: 'Start check-in', hint: 'Mood, stress, energy', icon: Sparkles },
  { to: '/log?tab=trends', label: 'Open trends', hint: 'Full history and ranges', icon: Activity },
  { to: '/proof', label: 'Verification', hint: 'Detector evidence', icon: ShieldCheck },
];

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
    crewId,
    missionSetting,
    supplies,
  } = useAppState();

  React.useEffect(() => {
    if (initialDay !== undefined) setViewDay(initialDay);
    // Initial test/demo day only; later changes come from the shared scrubber.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          label: finding.kind.replace(/_/g, ' '),
        });
      }
    }
    return [...byDay.values()].sort((a, b) => a.day - b.day);
  }, [analysis]);

  const timelineData = useMemo(
    () => (analysis ? buildTimelineData(analysis, ['heart_rate', 'sleep_hours'], 30) : []),
    [analysis],
  );

  const [activeCard, setActiveCard] = useState<AlertCard | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!activeCard) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveCard(null);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
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
      lastTriggerRef.current?.focus();
    };
  }, [activeCard]);

  if (loadFailed) {
    return (
      <div className="page-wrap">
        <div className="panel mx-auto max-w-xl px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-extrabold text-ink">Mission health</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Could not load simulated crew data. Reload the page to try again.
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="page-wrap">
        <div className="panel mx-auto max-w-xl px-6 py-12 text-center" role="status">
          <h1 className="font-display text-2xl font-extrabold text-ink">Mission health</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {loading ? 'Loading simulated crew data…' : 'No crew data is available.'}
          </p>
        </div>
      </div>
    );
  }

  const summaries: Record<DomainId, string> = {
    cardiovascular: `${shortReading(analysis, 'heart_rate', 'bpm')} · ${shortReading(analysis, 'bp_sys')}/${shortReading(analysis, 'bp_dia')} mmHg`,
    sleep_recovery: `${shortReading(analysis, 'sleep_hours', 'h')} · baseline ${analysis.baselines.sleep_hours?.median.toFixed(1) ?? '—'} h`,
    physical_performance: `${shortReading(analysis, 'exercise_minutes', 'min')} today`,
    behavioral: `Mood ${shortReading(analysis, 'mood')} · Stress ${shortReading(analysis, 'stress')}`,
    metabolic_general: `${shortReading(analysis, 'body_temp', '°C')} · glucose ${shortReading(analysis, 'glucose', 'mg/dL')}`,
    radiation: `${shortReading(analysis, 'radiation_dose', 'mSv')} today`,
  };

  const attentionCards = [...cards]
    .filter((card) => card.severity !== 'info')
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const infoCards = cards.filter((card) => card.severity === 'info');
  const openDomain = (domainId: DomainId) => navigate(`/domain/${domainId}`);
  const openAttention = (card: AlertCard, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setActiveCard(card);
  };
  const handleAttentionLog = (card: AlertCard) => {
    setActiveCard(null);
    navigate('/journal', { state: { card } });
  };

  const setting = MISSION_SETTINGS[missionSetting];
  const replyWindow = expectedReplyMinutes(missionSetting);

  const overall = attentionCards.some((card) => card.severity === 'urgent')
    ? { label: 'Urgent action may be needed', tone: 'urgent' as const }
    : attentionCards.some((card) => card.severity === 'review')
      ? { label: 'Review advised', tone: 'review' as const }
      : attentionCards.length > 0
        ? { label: 'Watch a few signals', tone: 'watch' as const }
        : { label: 'All monitored domains steady', tone: 'ok' as const };

  const monitoredCount = INDICATORS.filter(
    (indicator) => analysis.indicators[indicator.id]?.lastValue !== null,
  ).length;
  const stableDomains = DOMAIN_ORDER.filter((domain) => analysis.domains[domain]?.status === 'ok').length;

  const tileDefs: Array<{ id: IndicatorId; label: string; secondary?: IndicatorId; footer?: string }> = [
    { id: 'heart_rate', label: 'Resting heart rate' },
    { id: 'bp_sys', label: 'Blood pressure', secondary: 'bp_dia', footer: 'sys / dia · mmHg' },
    { id: 'body_temp', label: 'Body temperature' },
    { id: 'sleep_hours', label: 'Sleep' },
    { id: 'exercise_minutes', label: 'Exercise' },
    { id: 'stress', label: 'Stress score', footer: '1 calm to 5 high' },
  ];

  const trendSeries: TrendSeriesSpec[] = [
    { id: 'heart_rate', label: 'Heart rate (bpm)', color: 'var(--chart-hr)', unit: 'bpm', decimals: 0, area: true },
    { id: 'sleep_hours', label: 'Sleep (hours)', color: 'var(--chart-sleep)', unit: 'hrs', decimals: 1, axis: 'right' },
  ];

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker={`Mission ${crewId.replace('crew-', 'Crew ')} · ${setting.label}`}
        title={`Mission health overview`}
        description={
          <>
            Own-baseline monitoring for <span className="font-semibold text-ink">{crewName}</span>. Readings,
            expected adaptation, and mission-aware escalation are evaluated on this device.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">Mission day {viewDay} · {MISSION_DAYS}-day expedition</span>
            <span className={cn('chip', overall.tone === 'ok' ? 'chip-ok' : overall.tone === 'watch' ? 'chip-watch' : 'chip-review')}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {overall.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-ink-soft">
              <Radio className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
              {setting.oneWayDelayMinutes === 0
                ? 'Near-real-time ground link'
                : `${setting.oneWayDelayMinutes} min one-way delay`}
            </span>
          </>
        }
        actions={
          <>
            <Link to="/checkin" className="btn btn-secondary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Check-in
            </Link>
            <Link to="/log" className="btn btn-primary">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Log measurement
            </Link>
          </>
        }
      />

      {/* Metric strip */}
      <section aria-label="Health metrics" className="grid grid-cols-2 gap-2.5 md:grid-cols-3 2xl:grid-cols-6">
        {tileDefs.map((definition) => {
          const snapshot = metricSnapshot(analysis, definition.id, {
            secondaryId: definition.secondary,
            days: 14,
          });
          const secondaryValue =
            definition.secondary !== undefined
              ? analysis.indicators[definition.secondary]?.lastValue
              : null;
          return (
            <MetricTile
              key={definition.id}
              snapshot={snapshot}
              domain={METRIC_DOMAIN[definition.id] ?? 'cardiovascular'}
              label={definition.label}
              secondaryValue={secondaryValue !== null && secondaryValue !== undefined ? secondaryValue.toFixed(0) : undefined}
              footer={definition.footer}
            />
          );
        })}
      </section>

      {/* Body + attention */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <section
          aria-label="Astronaut body map and domains"
          className="relative overflow-hidden rounded-[24px] border border-white/85 bg-[linear-gradient(158deg,rgba(255,255,255,0.92)_0%,rgba(240,247,255,0.82)_58%,rgba(231,241,253,0.9)_100%)] shadow-float backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_82%_-10%,rgba(79,141,235,0.18),transparent_58%)]" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-3 px-4 pb-0 pt-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white/80 text-instrument shadow-xs">
                <Activity className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-[1.05rem] font-extrabold tracking-[-0.03em] text-ink">Body health overview</h2>
                <p className="text-[0.66rem] text-ink-soft">Risk-tinted live scan · drag to rotate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RingGauge
                value={stableDomains}
                max={DOMAIN_ORDER.length}
                size={46}
                stroke={4}
                color="var(--status-ok)"
                label={`${stableDomains}/${DOMAIN_ORDER.length}`}
                sublabel="steady"
                ariaLabel={`${stableDomains} of ${DOMAIN_ORDER.length} domains steady`}
              />
              <span className="chip chip-neutral">{monitoredCount} measures live</span>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <BodyHologram
              domains={analysis.domains}
              summaries={summaries}
              riskTone={overall.tone}
              onSelect={openDomain}
              className="md:order-2"
            />

            <div className="flex min-w-0 flex-col gap-1 px-3 pb-4 pt-1 md:order-1 md:pl-4">
              <p className="mb-1 px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.13em] text-ink-faint">
                Health domains
              </p>
              <ul className="flex flex-col gap-0.5">
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
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/70 px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok" aria-hidden="true" />
              Computed from {monitoredCount} indicators and {cards.length} guidance cards
            </span>
            <TextLink to="/about" className="!text-[0.64rem]">
              How Vigil decides
            </TextLink>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <TimelineScrubber
            day={viewDay}
            maxDay={MISSION_DAYS}
            markers={markers}
            onChange={setViewDay}
            onToday={() => setViewDay(120)}
            onPlayDemo={playDemoStory}
          />

          <section className="relative overflow-hidden rounded-[20px] border border-white/15 bg-[linear-gradient(155deg,#17365f_0%,#0d2344_52%,#08182c_100%)] p-4 text-white shadow-float">
            <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full border border-white/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(88,146,238,0.4),rgba(88,146,238,0)_70%)]" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-blue-200/80">
                  Ground-response window
                </p>
                <p className="mt-1 font-display text-[1.65rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                  ≥ {replyWindow} min
                </p>
                <p className="mt-1.5 max-w-[26ch] text-[0.64rem] leading-relaxed text-blue-100/70">
                  Estimated time before ground can reply in {setting.label.toLowerCase()}. Escalation
                  text adapts to this window.
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                <Timer className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5">
              <span className="chip !border-white/15 !bg-white/10 !text-blue-50">2 × delay + 10</span>
              <span className="chip !border-white/15 !bg-white/10 !text-blue-50">{setting.radiationRateMsvPerDay} mSv/day expected</span>
            </div>
          </section>
        </div>
      </div>

      {/* Timeline + alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <section aria-label="Mission health timeline" className="panel overflow-hidden px-4 pb-3 pt-4">
          <SectionHeading
            title="Mission health timeline"
            subtitle="Last 30 mission days · engine values only"
            action={
              <div className="flex items-center gap-2">
                <span className="chip chip-neutral tabular-nums">D{Math.max(1, viewDay - 29)}–D{viewDay}</span>
                <TextLink to="/log?tab=trends">All trends</TextLink>
              </div>
            }
          />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-faint">Resting heart rate</p>
              <div className="flex items-baseline gap-1.5">
                <span className="metric-number text-[1.6rem] leading-none">
                  {analysis.indicators.heart_rate.lastValue?.toFixed(0) ?? '—'}
                </span>
                <span className="text-[0.68rem] font-semibold text-ink-soft">bpm</span>
                <DeltaBadge
                  value={metricSnapshot(analysis, 'heart_rate').deltaPercent}
                  suffix="%"
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4 text-[0.62rem] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: 'var(--chart-hr)' }} />
                Heart rate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: 'var(--chart-sleep)' }} />
                Sleep
              </span>
            </div>
          </div>
          <TrendChart
            data={timelineData}
            series={trendSeries}
            height={220}
            ariaLabel="Heart rate and sleep over the last 30 mission days"
          />
        </section>

        <section aria-label="Quick actions" className="flex flex-col gap-2.5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-[16px] border border-white/80 bg-white/76 px-3.5 py-3 shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-float"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-instrument-soft text-instrument">
                  <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.78rem] font-semibold text-ink">{action.label}</span>
                  <span className="block text-[0.64rem] text-ink-soft">{action.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            );
          })}

          <div className="relative overflow-hidden rounded-[16px] border border-line bg-white/70 px-3.5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-faint">Monitored coverage</p>
              <span className="text-[0.6rem] font-semibold text-status-ok">{stableDomains} steady</span>
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface3">
              {DOMAIN_ORDER.map((domain) => {
                const status = analysis.domains[domain]?.status ?? 'ok';
                return (
                  <span
                    key={domain}
                    className={cn(
                      'h-full flex-1',
                      status === 'flagged' ? 'bg-status-review' : status === 'watch' ? 'bg-status-watch' : 'bg-status-ok',
                    )}
                    title={`${DOMAIN_LABELS[domain]}: ${status}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.6rem] text-ink-soft">
              <span>{DOMAIN_ORDER.length} domains · {INDICATORS.length} indicators</span>
              <Link to="/proof" className="font-semibold text-instrument hover:underline">
                Evidence
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Alerts */}
      <section aria-label="Attention items" className="flex flex-col gap-3">
        <SectionHeading
          title="What needs attention"
          subtitle={`Derived from day ${viewDay}; ordered by severity. Select a card for the full assessment.`}
          action={
            <div className="flex items-center gap-2">
              <span className="chip chip-neutral tabular-nums">{attentionCards.length} active</span>
              <Link
                to="/log"
                className="inline-flex min-h-[44px] items-center gap-1 text-[0.72rem] font-semibold text-instrument hover:text-instrument-deep"
              >
                Log today&apos;s measurements
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          }
        />

        {attentionCards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-line bg-white/60 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-ok-soft text-status-ok">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink">
              Nothing needs attention on day {viewDay}. Keep logging your measurements.
            </p>
            <Link to="/log" className="btn btn-primary mt-2">
              Log today&apos;s measurements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {attentionCards.map((card) => {
              const tone = ATTENTION_TONES[card.severity];
              const primaryDomain = card.domains[0];
              const reply = card.escalation.expectedReplyMinutes;
              return (
                <button
                  key={card.id}
                  type="button"
                  data-attention-card={card.id}
                  data-attention-title={card.title}
                  data-attention-severity={card.severity}
                  onClick={(event) => openAttention(card, event.currentTarget)}
                  className={cn(
                    'group relative flex min-h-[176px] w-full flex-col overflow-hidden rounded-[20px] border bg-white/82 p-4 text-left shadow-card backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-instrument focus-visible:ring-offset-2',
                    tone.border,
                  )}
                  aria-haspopup="dialog"
                  aria-label={`Open alert details: ${card.title}`}
                >
                  <span className={cn('absolute inset-x-0 top-0 h-[3px]', tone.rail)} aria-hidden="true" />
                  <span
                    className={cn('pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full opacity-[0.13] blur-2xl', tone.glow)}
                    aria-hidden="true"
                  />
                  <span className="relative flex items-start justify-between gap-2">
                    <SeverityMark severity={card.severity} />
                    <span className={cn('chip capitalize', tone.chip)}>{severityLabel(card.severity)}</span>
                  </span>
                  <span className="relative mt-3 line-clamp-2 font-display text-[0.92rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                    {card.title}
                  </span>
                  <span className="relative mt-1.5 line-clamp-2 text-[0.72rem] leading-relaxed text-ink-soft">
                    {card.observation}
                  </span>
                  <span className="relative mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="min-w-0 text-[0.6rem] font-medium text-ink-faint">
                      Day {card.day}
                      {primaryDomain && (
                        <span className="hidden sm:inline"> · {DOMAIN_LABELS[primaryDomain]}</span>
                      )}
                      {reply !== null && (
                        <span className="mt-1 block font-semibold text-ink-soft">
                          Ground reply ≥ {reply} min
                        </span>
                      )}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[0.62rem] font-semibold text-instrument transition-transform group-hover:translate-x-0.5">
                      Open
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {infoCards.length > 0 && (
          <details className="group overflow-hidden rounded-[18px] border border-line bg-white/62">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
              <span className="flex items-center gap-2 text-[0.78rem] font-semibold text-ink-soft">
                <Sparkles className="h-4 w-4 text-instrument/70" aria-hidden="true" />
                Expected changes ({infoCards.length})
              </span>
              <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
              {infoCards.map((card) => (
                <AlertCardView
                  key={card.id}
                  card={card}
                  sources={SOURCES}
                  telemetry={{ missionSetting, analysis, supplies }}
                />
              ))}
            </div>
          </details>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[0.6rem] text-ink-faint">
        <span>
          Severity order: {(['urgent', 'review', 'watch', 'info'] as const).map(severityLabel).join(' › ')}
        </span>
        <span>Last evaluated mission day {analysis.upToDay}</span>
      </footer>

      {activeCard &&
        createPortal(
          <div
            className="attention-overlay fixed inset-0 z-[80] flex items-center justify-center bg-[#06152b]/55 p-3 backdrop-blur-md sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveCard(null);
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Alert details: ${activeCard.title}`}
              tabIndex={-1}
              className="attention-dialog flex max-h-[92dvh] w-[min(780px,100%)] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(239,246,255,0.94))] shadow-[0_40px_120px_-30px_rgba(3,15,35,0.7)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/80 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn('h-2 w-2 rounded-full', ATTENTION_TONES[activeCard.severity].rail)}
                    aria-hidden="true"
                  />
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Attention detail
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setActiveCard(null)}
                  className="icon-btn text-ink-soft hover:bg-white hover:text-ink"
                  aria-label="Close alert details"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              </div>
              <div className="scroll-thin overflow-y-auto">
                <AlertCardView
                  card={activeCard}
                  sources={SOURCES}
                  onLog={handleAttentionLog}
                  detailMode
                  telemetry={{ missionSetting, analysis, supplies }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
