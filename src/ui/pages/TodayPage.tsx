import React, { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { DomainId, FindingKind, IndicatorId } from '@/contracts/types';
import { DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { DEFAULT_VIEW_DAY, MISSION_DAYS } from '@/contracts/constants';
import { BodyMap } from '@/ui/components/BodyMap';
import { DomainRow } from '@/ui/components/DomainRow';
import { TimelineScrubber, type ScrubberMarker } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { useAppState } from '@/app/AppState';
import { SOURCES } from '@/guidance';

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
  } = useAppState();

  useEffect(() => {
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

  const attentionCards = cards.filter((card) => card.severity !== 'info');
  const infoCards = cards.filter((card) => card.severity === 'info');
  const openDomain = (domainId: DomainId) => navigate(`/domain/${domainId}`);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Today</h1>
        <p className="text-sm text-ink-soft">
          {crewName}, day {viewDay} of {MISSION_DAYS}
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <section
          aria-label="Astronaut status and mission day"
          className="w-full flex flex-col gap-4 items-center"
        >
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

          <div className="w-full bg-panel p-4 rounded-sheet border border-line flex flex-col items-center order-2 lg:order-1">
            <h2 className="sr-only">Body map</h2>
            <BodyMap
              domains={analysis.domains}
              summaries={summaries}
              onSelect={openDomain}
            />
          </div>
        </section>

        <section aria-label="Health domains and attention items" className="w-full min-w-0 flex flex-col gap-6">
          <div className="bg-panel rounded-sheet border border-line overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h2 className="font-bold text-base text-ink">Body systems and domains</h2>
              <span className="text-xs text-ink-soft">Select a row for charts</span>
            </div>
            <ul className="divide-y divide-line">
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-bold text-lg text-ink">What needs attention</h2>
              <Link
                to="/log"
                className="text-xs sm:text-sm font-semibold text-instrument hover:underline inline-flex items-center min-h-[44px]"
              >
                Log today&apos;s measurements
              </Link>
            </div>

            {attentionCards.length === 0 ? (
              <div className="bg-panel border border-line rounded-sheet p-6 text-center">
                <p className="text-ink font-medium mb-3">
                  Nothing needs attention on day {viewDay}. Keep logging your measurements.
                </p>
                <Link
                  to="/log"
                  className="inline-flex items-center justify-center px-4 py-2 bg-instrument text-panel font-bold text-sm rounded-input min-h-[44px]"
                >
                  Log today&apos;s measurements
                </Link>
              </div>
            ) : (
              attentionCards.map((card) => (
                <AlertCardView
                  key={card.id}
                  card={card}
                  sources={SOURCES}
                  onLog={(selected) => navigate('/journal', { state: { card: selected } })}
                />
              ))
            )}

            {infoCards.length > 0 && (
              <details className="mt-2 border border-line rounded-sheet bg-panel overflow-hidden">
                <summary className="px-4 py-3 font-bold text-sm text-ink-soft cursor-pointer min-h-[44px] flex items-center">
                  Expected changes ({infoCards.length})
                </summary>
                <div className="p-4 pt-0 border-t border-line divide-y divide-line">
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
