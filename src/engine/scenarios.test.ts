import { describe, expect, it } from 'vitest';
import type { CrewDataset, GroundTruthKind, IndicatorId, ScenarioId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { generateScenario } from './index';

function config(scenarioId: ScenarioId, seed: number) {
  return {
    scenarioId,
    seed,
    crewId: 'crew-1',
    crewName: 'Crew 1',
    missionSetting: 'deep_space' as const,
  };
}

function valueOf(dataset: CrewDataset, day: number, id: IndicatorId): number | null {
  const record = dataset.records.find((candidate) => candidate.day === day);
  if (!record) throw new Error(`Day ${day} is missing`);
  return record.values[id] ?? null;
}

function meanOf(dataset: CrewDataset, id: IndicatorId, from: number, to: number): number {
  const present = dataset.records
    .filter((record) => record.day >= from && record.day <= to)
    .map((record) => record.values[id])
    .filter((value): value is number => typeof value === 'number');
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

const EXPECTED_GROUND_TRUTH: Record<
  ScenarioId,
  { kind: GroundTruthKind; isMedical: boolean; onsetDay: number; endDay: number | null }[]
> = {
  normal_adaptation: [],
  slow_drift: [{ kind: 'physiological_drift', isMedical: true, onsetDay: 70, endDay: null }],
  sensor_fault: [{ kind: 'sensor_fault', isMedical: false, onsetDay: 90, endDay: 92 }],
  blackout_drift: [{ kind: 'physiological_drift', isMedical: true, onsetDay: 95, endDay: null }],
  solar_event: [{ kind: 'solar_event', isMedical: true, onsetDay: 80, endDay: 83 }],
  acute_fever: [{ kind: 'acute_illness', isMedical: true, onsetDay: 120, endDay: 124 }],
};

describe('scenarios', () => {
  it('declares the correct ground truth for every scenario', () => {
    for (const [scenarioId, expected] of Object.entries(EXPECTED_GROUND_TRUTH)) {
      const dataset = generateScenario(config(scenarioId as ScenarioId, 5));
      expect(
        dataset.groundTruth.map((event) => ({
          kind: event.kind,
          isMedical: event.isMedical,
          onsetDay: event.onsetDay,
          endDay: event.endDay,
        })),
      ).toEqual(expected);
    }
  });

  it('raises heart rate by about 9 during slow_drift versus normal_adaptation', () => {
    const drift = generateScenario(config('slow_drift', 5));
    const normal = generateScenario(config('normal_adaptation', 5));
    const difference = meanOf(drift, 'heart_rate', 110, 120) - meanOf(normal, 'heart_rate', 110, 120);
    expect(difference).toBeGreaterThan(8);
    expect(difference).toBeLessThan(10);
  });

  it('places the sensor spike on day 90 and nulls heart rate on days 91 and 92', () => {
    const dataset = generateScenario(config('sensor_fault', 6));
    const spike = valueOf(dataset, 90, 'heart_rate');
    const before = meanOf(dataset, 'heart_rate', 80, 89);
    expect(spike).not.toBeNull();
    expect((spike ?? 0) - before).toBeGreaterThan(30);
    expect(valueOf(dataset, 91, 'heart_rate')).toBeNull();
    expect(valueOf(dataset, 92, 'heart_rate')).toBeNull();
  });

  it('blanks every indicator during the blackout days 100 to 107', () => {
    const dataset = generateScenario(config('blackout_drift', 7));
    for (const record of dataset.records) {
      if (record.day < 100 || record.day > 107) continue;
      for (const meta of INDICATORS) {
        expect(record.values[meta.id]).toBeNull();
      }
    }
  });

  it('raises radiation about sixfold on days 80 to 83 of solar_event', () => {
    const dataset = generateScenario(config('solar_event', 8));
    const ratio = meanOf(dataset, 'radiation_dose', 80, 83) / 1.8;
    expect(ratio).toBeGreaterThan(5);
    expect(ratio).toBeLessThan(7);
  });

  it('raises body temperature by about 1.5 on days 121 to 123 of acute_fever', () => {
    const fever = generateScenario(config('acute_fever', 9));
    const normal = generateScenario(config('normal_adaptation', 9));
    const difference = meanOf(fever, 'body_temp', 121, 123) - meanOf(normal, 'body_temp', 121, 123);
    expect(difference).toBeGreaterThan(1.2);
    expect(difference).toBeLessThan(1.8);
  });
});
