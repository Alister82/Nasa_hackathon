import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { DomainId, MissionContext } from '@/contracts/types';
import { DOMAIN_ORDER } from '@/contracts/indicators';
import { DEFAULT_VIEW_DAY } from '@/contracts/constants';
import { BodyMap } from '@/ui/components/BodyMap';
import { DomainRow } from '@/ui/components/DomainRow';
import { TimelineScrubber, type ScrubberMarker } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { getDataset, getAnalysis, getCards } from '@/app/services';
import { getDemoStoryConfig } from '@/app/demo';
import { mockSources } from '@/mocks/mockSources';

interface TodayPageProps {
  initialDay?: number;
}

export function TodayPage({ initialDay = DEFAULT_VIEW_DAY }: TodayPageProps) {
  const navigate = useNavigate();
  const [viewDay, setViewDay] = useState<number>(initialDay);
  const [selectedDomain, setSelectedDomain] = useState<DomainId | undefined>();
  const [expectedOpen, setExpectedOpen] = useState(false);

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

  const [analysis, setAnalysis] = useState(() => {
    const ds = getDemoStoryConfig();
    return getAnalysis(
      {
        crewId: ds.crewId,
        crewName: 'Crew 1',
        seed: ds.seed,
        scenarioId: ds.scenarioId,
        missionSetting: ds.missionSetting,
        preflightDays: 30,
        missionDays: 180,
        records: [],
        groundTruth: [],
        synthetic: true,
      },
      viewDay,
    );
  });

  useEffect(() => {
    let active = true;
    getDataset('crew-1').then((ds) => {
      if (active) {
        setAnalysis(getAnalysis(ds, viewDay));
      }
    });
    return () => {
      active = false;
    };
  }, [viewDay]);

  const cards = getCards(analysis, missionCtx);
  const attentionCards = cards.filter((c) => c.severity !== 'info');
  const infoCards = cards.filter((c) => c.severity === 'info');

  const markers: ScrubberMarker[] = analysis.findings.map((f) => ({
    day: f.firstFlaggedDay,
    status: f.urgent ? 'urgent' : f.kind === 'isolated_spike' || f.kind === 'data_quality_issue' ? 'watch' : 'review',
    label: f.kind.replace('_', ' '),
  }));

  const summaries: Record<DomainId, string> = {
    cardiovascular: 'Heart rate 73 bpm, systolic BP 124 mmHg',
    sleep_recovery: 'Sleep 5.6 hrs, down from 6.8 hrs baseline',
    physical_performance: 'Exercise adherence 95 min, steady',
    behavioral: 'Mood score 2.9, stress score 3.1',
    metabolic_general: 'Temperature 36.6 °C, glucose 90 mg/dL',
    radiation: 'Dose 1.8 mSv/day, within deep-space expectation',
  };

  const handleOpenDomain = (domainId: DomainId) => {
    navigate(`/domain/${domainId}`);
  };

  const handlePlayDemo = () => {
    const demo = getDemoStoryConfig();
    setViewDay(demo.viewDay);
    setSelectedDomain('cardiovascular');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Left Column (or Top on Mobile) */}
        <section
          aria-label="Astronaut Status and Mission Day"
          className="w-full flex flex-col gap-4 items-center"
        >
          {/* Timeline Scrubber */}
          <div className="w-full order-1 lg:order-2">
            <TimelineScrubber
              day={viewDay}
              maxDay={180}
              markers={markers}
              onChange={setViewDay}
              onToday={() => setViewDay(DEFAULT_VIEW_DAY)}
              onPlayDemo={handlePlayDemo}
            />
          </div>

          {/* Body Map */}
          <div className="w-full bg-panel p-4 rounded-sheet border border-line shadow-sm flex flex-col items-center order-2 lg:order-1">
            <h2 className="sr-only">Interactive Body Map</h2>
            <BodyMap
              domains={analysis.domains}
              summaries={summaries}
              selected={selectedDomain}
              onSelect={setSelectedDomain}
            />
          </div>
        </section>

        {/* Right Column: Domains + Cards + Quick Actions */}
        <section aria-label="Health Domains and Attention Items" className="w-full flex flex-col gap-6">
          {/* Domain List (6 rows in DOMAIN_ORDER) */}
          <div className="bg-panel rounded-sheet border border-line shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-panel border-b border-line flex items-center justify-between">
              <h2 className="font-bold text-base text-ink">Body Systems & Domains</h2>
              <span className="text-xs text-ink-soft">Click to view charts</span>
            </div>
            <ul className="divide-y divide-line">
              {DOMAIN_ORDER.map((domainId) => (
                <DomainRow
                  key={domainId}
                  domain={domainId}
                  analysis={analysis.domains[domainId]}
                  summary={summaries[domainId]}
                  onOpen={handleOpenDomain}
                />
              ))}
            </ul>
          </div>

          {/* What needs attention */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-ink">What needs attention</h2>
              <Link
                to="/log"
                className="text-xs sm:text-sm font-semibold text-instrument hover:underline"
              >
                + Log today's measurements
              </Link>
            </div>

            {attentionCards.length === 0 ? (
              <div className="bg-panel border border-line rounded-sheet p-6 text-center shadow-sm">
                <p className="text-ink font-medium mb-3">
                  Nothing needs attention on day {viewDay}. Keep logging your measurements.
                </p>
                <Link
                  to="/log"
                  className="inline-flex items-center justify-center px-4 py-2 bg-instrument text-panel font-bold text-sm rounded-input min-h-[44px]"
                >
                  Log today's measurements
                </Link>
              </div>
            ) : (
              attentionCards.map((card) => (
                <AlertCardView
                  key={card.id}
                  card={card}
                  sources={mockSources}
                  onLog={() => navigate('/journal')}
                />
              ))
            )}

            {/* Expected changes (info cards collapsed) */}
            {infoCards.length > 0 && (
              <div className="mt-2 border border-line rounded-sheet bg-panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpectedOpen(!expectedOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between font-bold text-sm text-ink-soft hover:text-ink min-h-[44px]"
                  aria-expanded={expectedOpen}
                >
                  <span>Expected changes ({infoCards.length})</span>
                  <span className="text-xs">{expectedOpen ? 'Hide' : 'Show'}</span>
                </button>
                {expectedOpen && (
                  <div className="p-4 pt-0 border-t border-line divide-y divide-line">
                    {infoCards.map((card) => (
                      <div key={card.id} className="pt-3">
                        <AlertCardView card={card} sources={mockSources} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
