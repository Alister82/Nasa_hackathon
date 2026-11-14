import React, { useState, useMemo } from 'react';
import type { ScenarioId, MissionSettingId, DailyFlag, SystemId } from '@/contracts/types';
import { SCENARIO_IDS, SCENARIO_LABELS } from '@/contracts/constants';
import { generateScenario, SYSTEMS } from '@/engine';
import { getAnalysis, getCards } from '@/app/services';
import { SystemsComparison } from '@/ui/components/SystemsComparison';
import { TimelineScrubber } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { SOURCES } from '@/guidance';
import { PageHeader, SectionCard } from '@/ui/components/PremiumComponents';

const selectCls =
  'w-full bg-bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors min-h-[44px]';

export function LabPage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('slow_drift');
  const [seed, setSeed] = useState<number>(42);
  const [missionSetting, setMissionSetting] = useState<MissionSettingId>('deep_space');
  const [viewDay, setViewDay] = useState<number>(120);

  const dataset = useMemo(() => {
    return generateScenario({
      scenarioId,
      seed,
      crewId: 'lab-crew',
      crewName: 'Lab Crew',
      missionSetting,
    });
  }, [scenarioId, seed, missionSetting]);

  const flags = useMemo(() => {
    const result: Record<SystemId, DailyFlag[]> = {
      vigil: SYSTEMS.vigil.run(dataset),
      threshold: SYSTEMS.threshold.run(dataset),
      zscore: SYSTEMS.zscore.run(dataset),
    };
    return result;
  }, [dataset]);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <PageHeader
        title="Scenario Lab"
        subtitle="Test and compare detection algorithms against simulated mission events with custom seeds."
      />

      {/* Configuration Panel */}
      <SectionCard>
        <h2 className="text-base font-bold text-text-primary mb-4">Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-select" className="text-xs font-semibold text-text-secondary">
              Scenario
            </label>
            <select
              id="scenario-select"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
              className={selectCls}
            >
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>
                  {SCENARIO_LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="seed-input" className="text-xs font-semibold text-text-secondary">
              Seed
            </label>
            <input
              id="seed-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className={selectCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="setting-select" className="text-xs font-semibold text-text-secondary">
              Mission setting
            </label>
            <select
              id="setting-select"
              value={missionSetting}
              onChange={(e) => setMissionSetting(e.target.value as MissionSettingId)}
              className={selectCls}
            >
              <option value="station">Space station</option>
              <option value="lunar_base">Lunar base</option>
              <option value="deep_space">Deep space</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-border flex-wrap">
          <span className="text-xs font-bold text-text-secondary mr-1">Inject scenarios:</span>
          {(['slow_drift', 'sensor_fault', 'acute_fever'] as ScenarioId[]).map((scId) => (
            <button
              key={scId}
              type="button"
              onClick={() => handleInject(scId)}
              className="px-3 py-1.5 bg-bg-app border border-border hover:border-accent hover:bg-accent/5 rounded-xl text-xs font-bold text-text-primary transition-colors min-h-[44px]"
            >
              {scId === 'slow_drift' ? 'Inject: slow drift' : scId === 'sensor_fault' ? 'Inject: sensor fault' : 'Inject: fever'}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Systems Comparison */}
      <SectionCard>
        <h2 className="text-base font-bold text-text-primary mb-4">Detection System Comparison</h2>
        <SystemsComparison dataset={dataset} flags={flags} />
      </SectionCard>

      {/* Timeline Scrubber */}
      <SectionCard>
        <h2 className="text-base font-bold text-text-primary mb-4">Mission Timeline</h2>
        <TimelineScrubber
          day={viewDay}
          maxDay={180}
          markers={[]}
          onChange={setViewDay}
          onToday={() => setViewDay(120)}
          onPlayDemo={() => handleInject('slow_drift')}
        />
      </SectionCard>

      {/* Alert Cards */}
      <section aria-label="Vigil Alert Cards for Selected Day" className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-text-primary">
          Vigil alert cards for Day {viewDay}
        </h2>
        {cards.length === 0 ? (
          <div className="bg-bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary">
            Vigil detects no anomaly on Day {viewDay} for this scenario.
          </div>
        ) : (
          cards.map((card) => (
            <AlertCardView key={card.id} card={card} sources={SOURCES} />
          ))
        )}
      </section>
    </div>
  );
}
