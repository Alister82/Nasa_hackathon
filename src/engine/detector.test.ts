import { describe, expect, it } from 'vitest';
import type { CrewDataset, DailyRecord, IndicatorId, MissionSettingId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { analyze, analyzeWithConfig } from './detector';
import { DETECTOR_CONFIG } from './detectorConfig';
import { generateScenario, truncateDataset } from './index';

/* ARCHITECTURE.md 6.6 starting values. The frozen production config is tuned for
the 6.9 goal; this config tests the CUSUM mechanic itself (see MEMORY section 9). */
const START_CONFIG = {
  ...DETECTOR_CONFIG,
  cusumK: 0.5,
  hWatch: 3,
  hFlag: 6,
  persistZ: 0.75,
  persistMinDays: 4,
};

const BASE_VALUES: Record<IndicatorId, number> = {
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
  for (const meta of INDICATORS) values[meta.id] = BASE_VALUES[meta.id];
  return values;
}

function buildDataset(
  missionSeries: Partial<Record<IndicatorId, (number | null)[]>> = {},
  setting: MissionSettingId = 'deep_space',
): CrewDataset {
  const records: DailyRecord[] = [];
  for (let day = -29; day <= 0; day++) {
    records.push({ day, values: baseValues() });
  }
  for (let day = 1; day <= 180; day++) {
    const values = baseValues();
    for (const meta of INDICATORS) {
      const series = missionSeries[meta.id];
      if (series) values[meta.id] = series[day - 1] ?? null;
    }
    records.push({ day, values });
  }
  return {
    crewId: 'crew-1',
    crewName: 'Crew 1',
    seed: 1,
    scenarioId: 'normal_adaptation',
    missionSetting: setting,
    preflightDays: 30,
    missionDays: 180,
    records,
    groundTruth: [],
    synthetic: true,
  };
}

function seriesWithStep(base: number, onsetDay: number, endDay: number, step: number): (number | null)[] {
  return Array.from({ length: 180 }, (_, index) => {
    const day = index + 1;
    return day >= onsetDay && day <= endDay ? base + step : base;
  });
}

describe('detector', () => {
  it('keeps a flat series ok with no findings', () => {
    const result = analyze(buildDataset(), 120);
    expect(result.baselineReady).toBe(true);
    for (const meta of INDICATORS) {
      expect(result.indicators[meta.id].status).toBe('ok');
    }
    expect(result.findings).toEqual([]);
  });

  it('flags a +1.5 sigma step within about 12 days at the 6.6 start constants', () => {
    const dataset = buildDataset({
      heart_rate: seriesWithStep(BASE_VALUES.heart_rate, 10, 60, 2.25),
    });
    expect(analyzeWithConfig(dataset, 12, START_CONFIG).indicators.heart_rate.status).not.toBe('flagged');
    expect(analyzeWithConfig(dataset, 22, START_CONFIG).indicators.heart_rate.status).toBe('flagged');
  });

  it('treats a single +8 sigma day as an isolated spike, not a flag', () => {
    const heartRate = Array.from({ length: 180 }, (_, index) =>
      index + 1 === 50 ? BASE_VALUES.heart_rate + 12 : BASE_VALUES.heart_rate,
    );
    const result = analyze(buildDataset({ heart_rate: heartRate }), 50);
    expect(result.indicators.heart_rate.isolatedSpike).toBe(true);
    expect(result.indicators.heart_rate.status).not.toBe('flagged');
    expect(result.findings.some((finding) => finding.kind === 'isolated_spike')).toBe(true);
  });

  it('marks data quality poor with 3 of the last 7 days missing', () => {
    const sleep = Array.from({ length: 180 }, (_, index) => {
      const day = index + 1;
      return day >= 10 && day <= 12 ? null : BASE_VALUES.sleep_hours;
    });
    const result = analyze(buildDataset({ sleep_hours: sleep }), 15);
    expect(result.indicators.sleep_hours.dataQuality).toBe('poor');
    expect(result.findings.some((finding) => finding.kind === 'data_quality_issue')).toBe(true);
  });

  it('emits a multi-signal pattern when two domains drift together', () => {
    const dataset = buildDataset({
      heart_rate: seriesWithStep(BASE_VALUES.heart_rate, 10, 90, 2.25),
      sleep_hours: seriesWithStep(BASE_VALUES.sleep_hours, 10, 90, -1.2),
    });
    const result = analyze(dataset, 60);
    const pattern = result.findings.find((finding) => finding.kind === 'multi_signal_pattern');
    expect(pattern).toBeDefined();
    expect(pattern?.indicators).toContain('heart_rate');
    expect(pattern?.indicators).toContain('sleep_hours');
    expect(pattern?.evidenceStrength).toBe('moderate');
    expect(result.domains.cardiovascular.status).toBe('flagged');
    expect(result.domains.sleep_recovery.status).toBe('flagged');
  });

  it('does not use future data', () => {
    const dataset = generateScenario({
      scenarioId: 'slow_drift',
      seed: 42,
      crewId: 'crew-1',
      crewName: 'Crew 1',
      missionSetting: 'deep_space',
    });
    for (const day of [30, 75, 90, 120, 180]) {
      expect(analyze(dataset, day)).toEqual(analyze(truncateDataset(dataset, day), day));
    }
  });

  it('reports fail-low glucose as an urgent hard threshold', () => {
    const series = Array.from({ length: 180 }, (_, index) =>
      index + 1 === 40 ? 50 : BASE_VALUES.glucose,
    );
    const result = analyze(buildDataset({ glucose: series }), 40);
    const urgent = result.findings.find((finding) => finding.kind === 'hard_threshold');
    expect(urgent?.urgent).toBe(true);
    expect(urgent?.indicators).toContain('glucose');
  });

  it('analyzes 180 days in under 500 ms', () => {
    const dataset = generateScenario({
      scenarioId: 'slow_drift',
      seed: 42,
      crewId: 'crew-1',
      crewName: 'Crew 1',
      missionSetting: 'deep_space',
    });
    const started = performance.now();
    analyze(dataset, 180);
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(500);
  });
});
