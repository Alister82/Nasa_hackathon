import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { DomainId, IndicatorId, MissionContext, AnalysisResult } from '@/contracts/types';
import { DOMAIN_LABELS, INDICATORS } from '@/contracts/indicators';
import { StatusChip, type StatusType } from '@/ui/components/StatusChip';
import { IndicatorChart } from '@/ui/charts/IndicatorChart';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { SOURCES, REFERENCE_RANGES, MEASUREMENT_HELP } from '@/guidance';
import { getDataset, getAnalysis, getCards } from '@/app/services';

export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const validDomainId = (domainId as DomainId) || 'cardiovascular';
  const domainMeta = DOMAIN_LABELS[validDomainId] ? validDomainId : 'cardiovascular';

  const [expandedHowTo, setExpandedHowTo] = useState<Record<string, boolean>>({});
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let active = true;
    getDataset('crew-1').then((ds) => {
      if (active) {
        setAnalysis(getAnalysis(ds, 120));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleHowTo = (id: IndicatorId) => {
    setExpandedHowTo((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const domainAnalysis = analysis?.domains[domainMeta];
  const indicatorsInDomain = INDICATORS.filter((i) => i.domain === domainMeta);

  // Status mapping
  const statusStr = domainAnalysis?.status ?? 'ok';
  const statusType: StatusType = statusStr === 'flagged' ? 'review' : (statusStr as StatusType);

  // Why it matters combined
  const whyItMattersCombined = indicatorsInDomain
    .map((i) => MEASUREMENT_HELP[i.id]?.whyItMatters)
    .filter(Boolean)
    .join(' ');

  const missionCtx: MissionContext = {
    setting: 'deep_space',
    supplies: {
      bp_cuff: true,
      thermometer: true,
      glucometer: true,
      wrist_hr_monitor: true,
      exercise_equipment: true,
      sleep_mask: true,
    },
  };

  const allCards = analysis ? getCards(analysis, missionCtx) : [];
  const domainCards = allCards.filter((c) => c.domains.includes(domainMeta));

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
      {/* Back navigation link */}
      <div className="mb-4">
        <Link
          to="/"
          className="text-instrument text-sm font-semibold hover:underline inline-flex items-center min-h-[44px]"
        >
          ← Back to Today
        </Link>
      </div>

      {/* Domain Header */}
      <div className="bg-panel border border-line rounded-sheet p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {DOMAIN_LABELS[domainMeta]}
          </h1>
          <StatusChip status={statusType} />
        </div>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          {whyItMattersCombined || 'Continuous monitoring of spaceflight adaptation indicators.'}
        </p>

        {/* Behavioral check-in action shortcut */}
        {domainMeta === 'behavioral' && (
          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Have you completed your check-in today?</span>
            <button
              type="button"
              onClick={() => navigate('/checkin')}
              className="px-3 py-1.5 bg-instrument text-panel font-bold text-xs sm:text-sm rounded-input min-h-[44px]"
            >
              Open check-in
            </button>
          </div>
        )}
      </div>

      {/* Indicator Charts */}
      {analysis && (
        <section aria-label="Indicator Charts" className="flex flex-col gap-6 mb-8">
          <h2 className="text-lg font-bold text-ink">Indicator trajectories</h2>

          {indicatorsInDomain.map((meta) => {
            const indAnalysis = analysis.indicators[meta.id];
            const baseline = analysis.baselines[meta.id];
            const range = REFERENCE_RANGES[meta.id];
            const help = MEASUREMENT_HELP[meta.id];
            const isHowToOpen = !!expandedHowTo[meta.id];

            if (!indAnalysis || !range) return null;

            return (
              <div key={meta.id} className="flex flex-col gap-2">
                <IndicatorChart
                  analysis={indAnalysis}
                  baseline={baseline}
                  meta={meta}
                  range={range}
                  height={240}
                />

                {/* How to measure expandable link */}
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
                          <strong>Associated spaceflight hazards:</strong> {help.hazards.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Alert Cards for this Domain */}
      {domainCards.length > 0 && (
        <section aria-label="Domain Findings" className="mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">Findings & guidance for this system</h2>
          <div className="flex flex-col gap-4">
            {domainCards.map((card) => (
              <AlertCardView
                key={card.id}
                card={card}
                sources={SOURCES}
                onLog={() => navigate('/journal')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
