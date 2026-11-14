import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { CheckInRecord, DomainId, IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS, DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { StatusChip, type StatusType } from '@/ui/components/StatusChip';
import { IndicatorChart } from '@/ui/charts/IndicatorChart';
import { CheckInTrend, type CheckInTrendPoint } from '@/ui/charts/CheckInTrend';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { SOURCES, REFERENCE_RANGES, MEASUREMENT_HELP } from '@/guidance';
import { useAppState } from '@/app/AppState';
import { loadCheckIns } from '@/storage';
import { SectionCard } from '@/ui/components/PremiumComponents';

function toStatusType(status: 'ok' | 'watch' | 'flagged'): StatusType {
  return status === 'flagged' ? 'review' : status;
}

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
      <div className="max-w-xl mx-auto px-4 py-12 text-center" role="status">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{DOMAIN_LABELS[domainMeta]}</h1>
        <p className="text-text-secondary">Loading simulated crew data...</p>
      </div>
    );
  }

  const domainAnalysis = analysis.domains[domainMeta];
  const statusType = toStatusType(domainAnalysis.status);
  const whyItMattersCombined = indicatorsInDomain
    .map((indicator) => MEASUREMENT_HELP[indicator.id]?.whyItMatters)
    .filter((text): text is string => Boolean(text))
    .join(' ');
  const domainCards = cards.filter((card) => card.domains.includes(domainMeta));

  const toggleHowTo = (id: IndicatorId) => {
    setExpandedHowTo((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:underline min-h-[44px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Domain Header */}
      <SectionCard>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {DOMAIN_LABELS[domainMeta]}
          </h1>
          <StatusChip status={statusType} />
        </div>
        {whyItMattersCombined && (
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {whyItMattersCombined}
          </p>
        )}

        {domainMeta === 'behavioral' && (
          <div className="mt-4 pt-4 border-t border-border">
            <h2 className="font-bold text-base text-text-primary mb-2">Check-in trend</h2>
            {checkIns.length > 0 ? (
              <CheckInTrend data={trendData} />
            ) : (
              <p className="text-sm text-text-secondary">
                No check-ins saved yet. The trend appears after the first check-in.
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/checkin')}
              className="mt-4 px-3 py-1.5 bg-accent text-white font-bold text-xs sm:text-sm rounded-xl hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Open check-in
            </button>
          </div>
        )}
      </SectionCard>

      {/* Indicator Charts */}
      <section aria-label="Indicator charts" className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-text-primary">Indicator trajectories</h2>

        {indicatorsInDomain.map((meta) => {
          const indicator = analysis.indicators[meta.id];
          const range = REFERENCE_RANGES[meta.id];
          const help = MEASUREMENT_HELP[meta.id];
          const isHowToOpen = Boolean(expandedHowTo[meta.id]);
          if (!indicator || !range) return null;

          return (
            <SectionCard key={meta.id}>
              <IndicatorChart
                analysis={indicator}
                baseline={analysis.baselines[meta.id]}
                meta={meta}
                range={range}
                height={240}
              />
              {help && (
                <div className="mt-3 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => toggleHowTo(meta.id)}
                    className="text-accent font-semibold hover:underline inline-flex items-center gap-1 min-h-[44px]"
                    aria-expanded={isHowToOpen}
                  >
                    {isHowToOpen ? 'Hide measurement guidance' : 'How to measure'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {isHowToOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                    </svg>
                  </button>
                  {isHowToOpen && (
                    <div className="bg-bg-app border border-border p-3 rounded-xl mt-2 text-text-primary leading-relaxed">
                      <p className="mb-2 font-medium">{help.howToMeasure}</p>
                      <p className="text-xs text-text-secondary">
                        <strong>Associated spaceflight hazards:</strong>{' '}
                        {help.hazards.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          );
        })}
      </section>

      {domainCards.length > 0 && (
        <section aria-label="Domain findings" className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-text-primary">Findings and guidance</h2>
          {domainCards.map((card) => (
            <AlertCardView
              key={card.id}
              card={card}
              sources={SOURCES}
              onLog={(selected) => navigate('/journal', { state: { card: selected } })}
            />
          ))}
        </section>
      )}
    </div>
  );
}
