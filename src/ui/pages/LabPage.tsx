import React, { useState, useMemo, useEffect } from 'react';
import type { ScenarioId, MissionSettingId, DailyFlag, SystemId, IndicatorId } from '@/contracts/types';
import { SCENARIO_IDS, SCENARIO_LABELS } from '@/contracts/constants';
import { generateScenario, SYSTEMS } from '@/engine';
import { getAnalysis, getCards } from '@/app/services';
import { SystemsComparison } from '@/ui/components/SystemsComparison';
import { TimelineScrubber } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { CusumInspector } from '@/ui/components/CusumInspector';
import { SOURCES } from '@/guidance';
import { FlaskConical, Play, Pause, RotateCcw } from 'lucide-react';

export function LabPage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('slow_drift');
  const [seed, setSeed] = useState<number>(42);
  const [missionSetting, setMissionSetting] = useState<MissionSettingId>('deep_space');
  const [viewDay, setViewDay] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto playback animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setViewDay((prev) => {
        if (prev >= 180) {
          setIsPlaying(false);
          return 180;
        }
        return prev + 1;
      });
    }, 120);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

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

  // Determine primary indicator for CUSUM inspector based on scenario
  const primaryIndicator: IndicatorId =
    scenarioId === 'acute_fever'
      ? 'body_temp'
      : scenarioId === 'solar_event'
        ? 'radiation_dose'
        : 'heart_rate';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Algorithm Benchmark
            </span>
            <span className="text-xs text-ink-soft">Day {viewDay} of 180</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1 flex items-center gap-2.5">
            <FlaskConical className="w-7 h-7 text-accent-primary" />
            <span>Scenario Lab</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary text-panel font-bold text-xs shadow-md hover:opacity-95 transition-all min-h-[44px]"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Pause Playback' : 'Play Timeline (1-180)'}</span>
        </button>
      </div>

      {/* Control Panel & Quick Injection Buttons */}
      <div className="glass-panel border border-line rounded-3xl p-5 shadow-card flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Scenario Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-select" className="text-xs font-bold text-ink-soft">
              Scenario
            </label>
            <select
              id="scenario-select"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
              className="bg-panel text-ink text-sm border border-line rounded-xl px-3 py-2 font-medium min-h-[44px]"
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
            <label htmlFor="seed-input" className="text-xs font-bold text-ink-soft">
              Seed
            </label>
            <input
              id="seed-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="bg-panel text-ink text-sm border border-line rounded-xl px-3 py-2 font-medium tabular-nums min-h-[44px]"
            />
          </div>

          {/* Setting Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="setting-select" className="text-xs font-bold text-ink-soft">
              Mission setting
            </label>
            <select
              id="setting-select"
              value={missionSetting}
              onChange={(e) => setMissionSetting(e.target.value as MissionSettingId)}
              className="bg-panel text-ink text-sm border border-line rounded-xl px-3 py-2 font-medium min-h-[44px]"
            >
              <option value="station">Space station</option>
              <option value="lunar_base">Lunar base</option>
              <option value="deep_space">Deep space</option>
            </select>
          </div>
        </div>

        {/* Shortcut injection buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-line/60 flex-wrap">
          <span className="text-xs font-bold text-ink-soft mr-1">Inject scenarios:</span>
          <button
            type="button"
            onClick={() => handleInject('slow_drift')}
            className="px-3.5 py-1.5 bg-panel border border-line hover:border-accent-primary rounded-xl text-xs font-bold text-ink min-h-[44px] transition-colors"
          >
            Inject: slow drift
          </button>
          <button
            type="button"
            onClick={() => handleInject('sensor_fault')}
            className="px-3.5 py-1.5 bg-panel border border-line hover:border-accent-primary rounded-xl text-xs font-bold text-ink min-h-[44px] transition-colors"
          >
            Inject: sensor fault
          </button>
          <button
            type="button"
            onClick={() => handleInject('acute_fever')}
            className="px-3.5 py-1.5 bg-panel border border-line hover:border-accent-primary rounded-xl text-xs font-bold text-ink min-h-[44px] transition-colors"
          >
            Inject: fever
          </button>
        </div>
      </div>

      {/* Systems Comparison Table and Timeline */}
      <SystemsComparison dataset={dataset} flags={flags} />

      {/* CUSUM Decision Boundary Inspector */}
      {analysis && (
        <CusumInspector
          analysis={analysis}
          indicatorId={primaryIndicator}
          viewDay={viewDay}
        />
      )}

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
          <div className="glass-panel border border-line rounded-2xl p-6 text-center text-ink-soft">
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
