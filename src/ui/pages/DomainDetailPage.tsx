import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  LineChart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { CheckInRecord, DomainId, IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS, DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { StatusChip, type StatusType } from '@/ui/components/StatusChip';
import { IndicatorChart } from '@/ui/charts/IndicatorChart';
import { CheckInTrend, type CheckInTrendPoint } from '@/ui/charts/CheckInTrend';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { DomainIcon, DOMAIN_VISUALS } from '@/ui/components/MetricTile';
import { EmptyState, PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { SOURCES, REFERENCE_RANGES, MEASUREMENT_HELP } from '@/guidance';
import { useAppState } from '@/app/AppState';
import { loadCheckIns } from '@/storage';
import { cn } from '@/ui/lib/format';

function toStatusType(status: 'ok' | 'watch' | 'flagged'): StatusType {
  return status === 'flagged' ? 'review' : status;
}

const STATUS_COPY: Record<StatusType, string> = {
  ok: 'All recorded values for this domain are within their expected range.',
  watch: 'One or more values sit near the expected edge. The trend matters more than a single reading.',
  review: 'The engine found a sustained departure from your own baseline or expected adaptation.',
  urgent: 'A reading or pattern needs immediate attention. Follow emergency procedures now.',
  info: 'Expected adaptation rather than a change that needs clinical review.',
};

export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { crewId, viewDay, analysis, cards } = useAppState();
  const [expandedHowTo, setExpandedHowTo] = useState<Record<string, boolean>>({});
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  const domainMeta: DomainId = DOMAIN_ORDER.includes(domainId as DomainId)
    ? (domainId as DomainId)
    : 'cardiovascular';

  useEffect(() => {
    let active = true;
    void loadCheckIns(crewId).then((records) => {
      if (active) setCheckIns(records);
    });
    return () => {
      active = false;
    };
  }, [crewId]);

  const indicatorsInDomain = useMemo(
    () => INDICATORS.filter((indicator) => indicator.domain === domainMeta),
    [domainMeta],
  );

  const trendData = useMemo<CheckInTrendPoint[]>(() => {
    if (domainMeta !== 'behavioral' || !analysis) return [];
    const start = Math.max(1, viewDay - 29);
    const byDay = new Map(checkIns.map((record) => [record.day, record]));
    const sleepPoints = new Map(
      analysis.indicators.sleep_hours.points.map((point) => [point.day, point.value]),
    );
    const data: CheckInTrendPoint[] = [];
    for (let day = start; day <= viewDay; day += 1) {
      const record = byDay.get(day);
      const sleep = sleepPoints.get(day);
      data.push({
        day,
        mood: record?.mood,
        stress: record?.stress,
        energy: record?.energy,
        sleep: typeof sleep === 'number' ? sleep : undefined,
      });
    }
    return data;
  }, [analysis, checkIns, domainMeta, viewDay]);

  if (!analysis) {
    return (
      <div className="page-wrap">
        <div className="panel mx-auto max-w-xl px-6 py-12 text-center" role="status">
          <h1 className="font-display text-2xl font-extrabold text-ink">{DOMAIN_LABELS[domainMeta]}</h1>
          <p className="mt-2 text-sm text-ink-soft">Loading simulated crew data…</p>
        </div>
      </div>
    );
  }

  const domainAnalysis = analysis.domains[domainMeta];
  const statusType = toStatusType(domainAnalysis.status);
  const visual = DOMAIN_VISUALS[domainMeta];
  const whyItMattersCombined = indicatorsInDomain
    .map((indicator) => MEASUREMENT_HELP[indicator.id]?.whyItMatters)
    .filter((text): text is string => Boolean(text))
    .join(' ');
  const domainCards = cards.filter((card) => card.domains.includes(domainMeta));
  const measured = indicatorsInDomain.filter(
    (indicator) => analysis.indicators[indicator.id]?.lastValue !== null,
  ).length;

  const toggleHowTo = (id: IndicatorId) => {
    setExpandedHowTo((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <div className="page-wrap flex flex-col gap-5">
      <Link
        to="/"
        className="inline-flex w-fit min-h-[44px] items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Today
      </Link>

      <section className="relative overflow-hidden rounded-[24px] border border-white/85 bg-[linear-gradient(158deg,rgba(255,255,255,0.94)_0%,rgba(241,248,255,0.88)_100%)] p-4 shadow-float backdrop-blur-xl sm:p-5">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${visual.soft}, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/80 shadow-sm"
                style={{ backgroundColor: visual.soft, color: visual.color }}
                aria-hidden="true"
              >
                <DomainIcon domain={domainMeta} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="section-kicker">Health domain</p>
                <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[1.8rem]">
                  {DOMAIN_LABELS[domainMeta]}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusChip status={statusType} />
                  <span className="chip chip-neutral">{measured}/{indicatorsInDomain.length} measures live</span>
                  <span className="chip chip-neutral">
                    {domainCards.length} guidance card{domainCards.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {domainMeta === 'behavioral' && (
                <button
                  type="button"
                  onClick={() => navigate('/checkin')}
                  className="btn btn-secondary"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Open check-in
                </button>
              )}
              <TextLink to="/log?tab=trends">All trends</TextLink>
            </div>
          </div>

          <p className="max-w-3xl text-[0.8rem] leading-relaxed text-ink-2">{whyItMattersCombined}</p>

          <div className="flex flex-wrap items-start gap-2 rounded-[14px] border border-line/80 bg-white/65 px-3 py-2.5">
            <ShieldCheck
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                statusType === 'review'
                  ? 'text-status-review'
                  : statusType === 'watch'
                    ? 'text-status-watch'
                    : 'text-status-ok',
              )}
              aria-hidden="true"
            />
            <p className="text-[0.72rem] leading-relaxed text-ink-soft">{STATUS_COPY[statusType]}</p>
          </div>
        </div>
      </section>

      {domainMeta === 'behavioral' && (
        <section aria-label="Check-in trend" className="panel overflow-hidden">
          <header className="border-b border-line/80 px-4 py-3">
            <SectionHeading
              title="Check-in trend"
              subtitle="Self-reported mood, stress, and energy next to sleep hours for the same days."
              action={<TextLink to="/checkin">New check-in</TextLink>}
            />
          </header>
          <div className="p-4">
            {checkIns.length > 0 ? (
              <CheckInTrend data={trendData} />
            ) : (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" />}
                title="No check-ins saved yet"
                description="The trend appears after the first check-in. Ratings stay on this device."
                action={
                  <button type="button" onClick={() => navigate('/checkin')} className="btn btn-primary">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Open check-in
                  </button>
                }
              />
            )}
          </div>
        </section>
      )}

      <section aria-label="Indicator charts" className="flex flex-col gap-3">
        <SectionHeading
          title="Indicator trajectories"
          subtitle="Observed readings against expected adaptation and your own pre-flight baseline."
          action={<span className="chip chip-neutral">{indicatorsInDomain.length} indicators</span>}
        />

        {indicatorsInDomain.length === 0 ? (
          <EmptyState
            icon={<LineChart className="h-5 w-5" />}
            title="No indicators in this domain"
            description="This domain has no configured indicators in the current build."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {indicatorsInDomain.map((meta) => {
              const indicator = analysis.indicators[meta.id];
              const range = REFERENCE_RANGES[meta.id];
              const help = MEASUREMENT_HELP[meta.id];
              const isHowToOpen = Boolean(expandedHowTo[meta.id]);
              if (!indicator || !range) return null;

              return (
                <div key={meta.id} className="flex min-w-0 flex-col gap-2">
                  <IndicatorChart
                    analysis={indicator}
                    baseline={analysis.baselines[meta.id]}
                    meta={meta}
                    range={range}
                    height={220}
                  />
                  {help && (
                    <div className="px-1">
                      <button
                        type="button"
                        onClick={() => toggleHowTo(meta.id)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-[0.68rem] font-semibold text-instrument hover:text-instrument-deep"
                        aria-expanded={isHowToOpen}
                      >
                        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                        {isHowToOpen ? 'Hide measurement guidance' : 'How to measure'}
                        <ChevronDown
                          className={cn('h-3 w-3 transition-transform', isHowToOpen && 'rotate-180')}
                          aria-hidden="true"
                        />
                      </button>
                      {isHowToOpen && (
                        <div className="mt-1 rounded-xl border border-line bg-white/75 px-3 py-2.5">
                          <p className="text-[0.72rem] leading-relaxed text-ink-2">{help.howToMeasure}</p>
                          <p className="mt-2 text-[0.64rem] leading-relaxed text-ink-soft">
                            <strong className="font-semibold text-ink-soft">Associated spaceflight hazards:</strong>{' '}
                            {help.hazards.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {domainCards.length > 0 && (
        <section aria-label="Domain findings" className="flex flex-col gap-3">
          <SectionHeading
            title="Findings and guidance"
            subtitle="Generated from this domain's evidence, with the same mission-aware escalation as the dashboard."
            action={<span className="chip chip-neutral">{domainCards.length} cards</span>}
          />
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {domainCards.map((card) => (
              <AlertCardView
                key={card.id}
                card={card}
                sources={SOURCES}
                onLog={(selected) => navigate('/journal', { state: { card: selected } })}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[0.62rem] text-ink-faint">
        <span>Evaluated through mission day {analysis.upToDay}.</span>
        <Link
          to="/about"
          className="inline-flex min-h-[44px] items-center font-semibold text-instrument hover:underline"
        >
          How Vigil decides
        </Link>
      </footer>
    </div>
  );
}
