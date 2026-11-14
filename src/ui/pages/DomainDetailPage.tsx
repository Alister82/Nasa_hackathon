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
        <h1 className="text-2xl font-bold text-ink mb-2">{DOMAIN_LABELS[domainMeta]}</h1>
        <p className="text-ink-soft">Loading simulated crew data...</p>
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
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
      <div className="mb-4">
        <Link
          to="/"
          className="text-instrument text-sm font-semibold hover:underline inline-flex items-center min-h-[44px]"
        >
          Back to Today
        </Link>
      </div>

      <div className="bg-panel border border-line rounded-sheet p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {DOMAIN_LABELS[domainMeta]} ({domainMeta === 'cardiovascular' ? 'Cardiovascular' : domainMeta.replace('_', ' ')})
          </h1>
          <StatusChip status={statusType} />
        </div>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          {whyItMattersCombined}
        </p>

        {domainMeta === 'behavioral' && (
          <div className="mt-4 pt-4 border-t border-line">
            <h2 className="font-bold text-base text-ink mb-2">Check-in trend</h2>
            {checkIns.length > 0 ? (
              <CheckInTrend data={trendData} />
            ) : (
              <p className="text-sm text-ink-soft">
                No check-ins saved yet. The trend appears after the first check-in.
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/checkin')}
              className="mt-4 px-3 py-1.5 bg-instrument text-panel font-bold text-xs sm:text-sm rounded-input min-h-[44px]"
            >
              Open check-in
            </button>
          </div>
        )}
      </div>

      <section aria-label="Indicator charts" className="flex flex-col gap-6 mb-8">
        <h2 className="text-lg font-bold text-ink">Indicator trajectories</h2>

        {indicatorsInDomain.map((meta) => {
          const indicator = analysis.indicators[meta.id];
          const range = REFERENCE_RANGES[meta.id];
          const help = MEASUREMENT_HELP[meta.id];
          const isHowToOpen = Boolean(expandedHowTo[meta.id]);
          if (!indicator || !range) return null;

          return (
            <div key={meta.id} className="flex flex-col gap-2">
              <IndicatorChart
                analysis={indicator}
                baseline={analysis.baselines[meta.id]}
                meta={meta}
                range={range}
                height={240}
              />
              {help && (
                <div className="px-1 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => toggleHowTo(meta.id)}
                    className="text-instrument font-semibold hover:underline inline-flex items-center min-h-[44px]"
                    aria-expanded={isHowToOpen}
                  >
                    {isHowToOpen ? 'Hide measurement guidance' : 'How to measure'}
                  </button>
                  {isHowToOpen && (
                    <div className="bg-panel border border-line p-3 rounded-sheet mt-1 text-ink leading-relaxed">
                      <p className="mb-2 font-medium">{help.howToMeasure}</p>
                      <p className="text-xs text-ink-soft">
                        <strong>Associated spaceflight hazards:</strong>{' '}
                        {help.hazards.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {domainCards.length > 0 && (
        <section aria-label="Domain findings" className="mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">Findings and guidance</h2>
          <div className="flex flex-col gap-4">
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
    </div>
  );
}
