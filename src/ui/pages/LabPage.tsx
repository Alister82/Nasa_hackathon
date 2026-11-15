import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Info,
  Play,
  SlidersHorizontal,
  Sparkles,
  TestTube2,
} from '@/ui/components/icons';
import type { DailyFlag, MissionSettingId, ScenarioId, SystemId } from '@/contracts/types';
import { MISSION_DAYS, SCENARIO_IDS, SCENARIO_LABELS } from '@/contracts/constants';
import { generateScenario, SYSTEMS } from '@/engine';
import { getAnalysis, getCards } from '@/app/services';
import { SystemsComparison } from '@/ui/components/SystemsComparison';
import { TimelineScrubber } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { EmptyState, PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { SOURCES, MISSION_SETTINGS } from '@/guidance';
import { cn } from '@/ui/lib/format';
import { ScientificGroundingPanel } from '@/ui/components/ScientificGroundingPanel';

const INJECTIONS: Array<{ id: ScenarioId; label: string }> = [
  { id: 'slow_drift', label: 'Inject: slow drift' },
  { id: 'sensor_fault', label: 'Inject: sensor fault' },
  { id: 'acute_fever', label: 'Inject: fever' },
];

export function LabPage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('slow_drift');
  const [seed, setSeed] = useState<number>(42);
  const [missionSetting, setMissionSetting] = useState<MissionSettingId>('deep_space');
  const [viewDay, setViewDay] = useState<number>(120);

  // Generate scenario locally for lab (does not overwrite user data)
  const dataset = useMemo(() => {
    return generateScenario({
      scenarioId,
      seed,
      crewId: 'lab-crew',
      crewName: 'Lab Crew',
      missionSetting,
    });
  }, [scenarioId, seed, missionSetting]);

  // Compute daily flags for all 3 detection systems
  const flags = useMemo(() => {
    const result: Record<SystemId, DailyFlag[]> = {
      vigil: SYSTEMS.vigil.run(dataset),
      threshold: SYSTEMS.threshold.run(dataset),
      zscore: SYSTEMS.zscore.run(dataset),
    };
    return result;
  }, [dataset]);

  // Vigil analysis & cards for the selected view day
  const analysis = useMemo(() => {
    return getAnalysis(dataset, viewDay);
  }, [dataset, viewDay]);

  const cards = useMemo(() => {
    return getCards(analysis, {
      setting: missionSetting,
      supplies: {
        bp_cuff: true,
        thermometer: true,
        glucometer: true,
        wrist_hr_monitor: true,
        exercise_equipment: true,
        sleep_mask: true,
      },
    });
  }, [analysis, missionSetting]);

  const handleInject = (scId: ScenarioId) => {
    setScenarioId(scId);
    if (scId === 'acute_fever') {
      setViewDay(122);
    } else if (scId === 'sensor_fault') {
      setViewDay(91);
    } else {
      setViewDay(120);
    }
  };

  const setting = MISSION_SETTINGS[missionSetting];
  const vigilFlags = (flags.vigil ?? []).filter((flag) => flag.flagged).length;

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Detection lab"
        title="Scenario Lab"
        description={
          <>
            Test and compare detection algorithms against simulated mission events with custom
            seeds. The lab runs entirely on this device and never overwrites crew records.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <FlaskConical className="h-3 w-3" aria-hidden="true" />
              {SCENARIO_LABELS[scenarioId]}
            </span>
            <span className="chip chip-neutral">Seed {seed}</span>
            <span className="chip chip-neutral">{setting.label}</span>
            <span className="chip chip-neutral">{vigilFlags} Vigil flag days</span>
          </>
        }
        actions={<TextLink to="/proof">Verification results</TextLink>}
      />

      <ScientificGroundingPanel />

      <section className="panel overflow-hidden">
        <header className="flex items-center gap-2 border-b border-line/80 bg-surface2/55 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-ink">
              Scenario controls
            </h2>
            <p className="text-[0.64rem] text-ink-soft">
              Changing any control regenerates the simulated dataset deterministically.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-select" className="field-label">
              Scenario
            </label>
            <select
              id="scenario-select"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
              className="field"
            >
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>
                  {SCENARIO_LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="seed-input" className="field-label">
              Seed
            </label>
            <input
              id="seed-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="field tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="setting-select" className="field-label">
              Mission setting
            </label>
            <select
              id="setting-select"
              value={missionSetting}
              onChange={(e) => setMissionSetting(e.target.value as MissionSettingId)}
              className="field"
            >
              <option value="station">Space station</option>
              <option value="lunar_base">Lunar base</option>
              <option value="deep_space">Deep space</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line/80 bg-surface2 px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">
            <TestTube2 className="h-3.5 w-3.5" aria-hidden="true" />
            Inject scenarios
          </span>
          {INJECTIONS.map((injection) => (
            <button
              key={injection.id}
              type="button"
              onClick={() => handleInject(injection.id)}
              className={cn(
                'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 text-[0.68rem] font-semibold transition-all',
                scenarioId === injection.id
                  ? 'border-instrument/30 bg-instrument-soft text-instrument-deep shadow-xs'
                  : 'border-line bg-white text-ink-soft hover:border-line-strong hover:text-ink',
              )}
            >
              {injection.label}
            </button>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[0.62rem] text-ink-soft">
            <Info className="h-3 w-3" aria-hidden="true" />
            {dataset.missionDays}-day simulated mission
          </span>
        </div>
      </section>

      {analysis ? (
        <SystemsComparison dataset={dataset} flags={flags} />
      ) : (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Scenario not evaluated"
          description="Adjust the controls to generate a simulated dataset and run the detector comparison."
        />
      )}

      <TimelineScrubber
        day={viewDay}
        maxDay={MISSION_DAYS}
        markers={[]}
        onChange={setViewDay}
        onToday={() => setViewDay(120)}
        onPlayDemo={() => handleInject('slow_drift')}
      />

      <section aria-label="Vigil Alert Cards for Selected Day" className="flex flex-col gap-3">
        <SectionHeading
          title={`Vigil alert cards for Day ${viewDay}`}
          subtitle={`Generated from the lab dataset at seed ${seed}. These cards do not affect crew records.`}
          action={
            <Link
              to="/"
              className="inline-flex min-h-[32px] items-center gap-1.5 text-[0.72rem] font-semibold text-instrument hover:text-instrument-deep"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Back to live dashboard
            </Link>
          }
        />
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-line bg-surface2 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-status-ok-soft text-status-ok">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink">
              Vigil detects no anomaly on Day {viewDay} for this scenario.
            </p>
            <p className="text-xs text-ink-soft">
              Try another scenario, seed, or mission day to see how guidance changes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {cards.map((card) => (
              <AlertCardView key={card.id} card={card} sources={SOURCES} modalOnExpand />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
