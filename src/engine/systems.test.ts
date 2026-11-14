import { describe, expect, it } from 'vitest';
import type { CrewDataset, DailyFlag, DailyRecord, IndicatorId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { SYSTEMS, analyze, generateScenario } from './index';

const BASE: Record<IndicatorId, number> = {
  heart_rate: 64,
  bp_sys: 116,
  bp_dia: 74,
  body_temp: 36.6,
  glucose: 90,
  sleep_hours: 6.8,
  exercise_minutes: 120,
  mood: 3.8,
  stress: 2.2,
  energy: 3.7,
  radiation_dose: 1.8,
};

function baseValues(): Partial<Record<IndicatorId, number | null>> {
  const values: Partial<Record<IndicatorId, number | null>> = {};
  for (const meta of INDICATORS) values[meta.id] = BASE[meta.id];
  return values;
}

function buildDataset(
  series: Partial<Record<IndicatorId, (number | null)[]>>,
  preflightNull: IndicatorId[] = [],
): CrewDataset {
  const preflight = baseValues();
  for (const id of preflightNull) preflight[id] = null;
  const records: DailyRecord[] = [];
  for (let day = -29; day <= 0; day++) records.push({ day, values: { ...preflight } });
  for (let day = 1; day <= 180; day++) {
    const values = baseValues();
    for (const meta of INDICATORS) {
      const custom = series[meta.id];
      if (custom) values[meta.id] = custom[day - 1] ?? null;
    }
    records.push({ day, values });
  }
  return {
    crewId: 'crew-1',
    crewName: 'Crew 1',
    seed: 1,
    scenarioId: 'normal_adaptation',
    missionSetting: 'deep_space',
    preflightDays: 30,
    missionDays: 180,
    records,
    groundTruth: [],
    synthetic: true,
  };
}

function isFlagged(flags: DailyFlag[], day: number): boolean {
  return flags[day - 1]?.flagged ?? false;
}

function scenarioConfig(scenarioId: 'normal_adaptation' | 'slow_drift' | 'solar_event', seed: number) {
  return {
    scenarioId,
    seed,
    crewId: 'crew-1',
    crewName: 'Crew 1',
    missionSetting: 'deep_space' as const,
  };
}

describe('systems', () => {
  it('each returns 180 daily flags for mission days 1 to 180', () => {
    const dataset = generateScenario(scenarioConfig('normal_adaptation', 1));
    for (const id of ['vigil', 'threshold', 'zscore'] as const) {
      const flags = SYSTEMS[id].run(dataset);
      expect(flags).toHaveLength(180);
      expect(flags.map((flag) => flag.day)).toEqual(
        Array.from({ length: 180 }, (_, index) => index + 1),
      );
    }
  });

  it('threshold flags a day with heart rate 101 and not the day before', () => {
    const heartRate = Array.from({ length: 180 }, (_, index) => (index + 1 === 5 ? 101 : 64));
    const flags = SYSTEMS.threshold.run(buildDataset({ heart_rate: heartRate }));
    expect(isFlagged(flags, 5)).toBe(true);
    expect(isFlagged(flags, 4)).toBe(false);
  });

  it('zscore needs at least 7 values in the window', () => {
    const heartRate = Array.from({ length: 180 }, (_, index) => {
      const day = index + 1;
      return day === 5 ? 150 : day === 11 ? 170 : 64;
    });
    const flags = SYSTEMS.zscore.run(buildDataset({ heart_rate: heartRate }, ['heart_rate']));
    expect(isFlagged(flags, 5)).toBe(false);
    expect(isFlagged(flags, 11)).toBe(true);
  });

  it('vigil flag days match analyze findings', () => {
    const dataset = generateScenario(scenarioConfig('slow_drift', 42));
    const flags = SYSTEMS.vigil.run(dataset);
    const serious = new Set(['persistent_change', 'multi_signal_pattern', 'radiation_event', 'hard_threshold']);
    for (const day of [1, 45, 90, 120, 180]) {
      const expected = analyze(dataset, day).findings.some((finding) => serious.has(finding.kind));
      expect(isFlagged(flags, day)).toBe(expected);
    }
  });

  it('all systems use the shared radiation rule on a solar event', () => {
    const dataset = generateScenario(scenarioConfig('solar_event', 8));
    for (const id of ['vigil', 'threshold', 'zscore'] as const) {
      expect(isFlagged(SYSTEMS[id].run(dataset), 80)).toBe(true);
    }
  });
});
