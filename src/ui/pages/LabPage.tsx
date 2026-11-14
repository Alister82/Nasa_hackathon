import React, { useState, useMemo } from 'react';
import type { ScenarioId, MissionSettingId, DailyFlag, SystemId } from '@/contracts/types';
import { SCENARIO_IDS, SCENARIO_LABELS } from '@/contracts/constants';
import { generateScenario, SYSTEMS } from '@/engine';
import { getAnalysis, getCards } from '@/app/services';
import { SystemsComparison } from '@/ui/components/SystemsComparison';
import { TimelineScrubber } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { SOURCES } from '@/guidance';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Screen Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Scenario Lab</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Test and compare detection algorithms against simulated mission events with custom seeds.
        </p>
      </div>

      {/* Control Panel & Quick Injection Buttons */}
      <div className="bg-panel border border-line rounded-sheet p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Scenario Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-select" className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Scenario
            </label>
            <select
              id="scenario-select"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
              className="bg-ceramic text-ink text-sm border border-line rounded-input px-3 py-2 font-medium min-h-[44px]"
            >
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>
                  {SCENARIO_LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          {/* Seed Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="seed-input" className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Seed
            </label>
            <input
              id="seed-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="bg-ceramic text-ink text-sm border border-line rounded-input px-3 py-2 font-medium tabular-nums min-h-[44px]"
            />
          </div>

          {/* Setting Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="setting-select" className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Mission Setting
            </label>
            <select
              id="setting-select"
              value={missionSetting}
              onChange={(e) => setMissionSetting(e.target.value as MissionSettingId)}
              className="bg-ceramic text-ink text-sm border border-line rounded-input px-3 py-2 font-medium min-h-[44px]"
            >
              <option value="station">Space station</option>
              <option value="lunar_base">Lunar base</option>
              <option value="deep_space">Deep space</option>
            </select>
          </div>
        </div>

        {/* Shortcut injection buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-line flex-wrap">
          <span className="text-xs font-bold text-ink-soft mr-1">Inject scenarios:</span>
          <button
            type="button"
            onClick={() => handleInject('slow_drift')}
            className="px-3 py-1.5 bg-ceramic border border-line hover:border-instrument rounded-input text-xs font-bold text-ink min-h-[44px]"
          >
            Inject: slow drift
          </button>
          <button
            type="button"
            onClick={() => handleInject('sensor_fault')}
            className="px-3 py-1.5 bg-ceramic border border-line hover:border-instrument rounded-input text-xs font-bold text-ink min-h-[44px]"
          >
            Inject: sensor fault
          </button>
          <button
            type="button"
            onClick={() => handleInject('acute_fever')}
            className="px-3 py-1.5 bg-ceramic border border-line hover:border-instrument rounded-input text-xs font-bold text-ink min-h-[44px]"
          >
            Inject: fever
          </button>
        </div>
      </div>

      {/* Systems Comparison Table and Timeline */}
      <SystemsComparison dataset={dataset} flags={flags} />

      {/* Timeline scrubber for Lab */}
      <TimelineScrubber
        day={viewDay}
        maxDay={180}
        markers={[]}
        onChange={setViewDay}
        onToday={() => setViewDay(120)}
        onPlayDemo={() => handleInject('slow_drift')}
      />

      {/* Vigil Alert Cards for View Day */}
      <section aria-label="Vigil Alert Cards for Selected Day" className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">
          Vigil alert cards for Day {viewDay}
        </h2>
        {cards.length === 0 ? (
          <div className="bg-panel border border-line rounded-sheet p-6 text-center text-ink-soft">
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
