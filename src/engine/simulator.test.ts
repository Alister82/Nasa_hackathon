import { describe, expect, it } from 'vitest';
import type { CrewDataset, IndicatorId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { SIM_PARAMS } from './simulator';
import { generateScenario } from './index';

function normalConfig(seed:number) {
  return {
    scenarioId: 'normal_adaptation' as const,
    seed,
    crewId: 'crew-1',
    crewName: 'Crew 1',
    missionSetting: 'deep_space' as const,
  };
}

function values(dataset: CrewDataset, id: IndicatorId, from: number, to: number): number[] {
  return dataset.records
    .filter((record) => record.day >= from && record.day <= to)
    .map((record) => record.values[id])
    .filter((value): value is number => typeof value === 'number');
}

function mean(items: number[]): number {
  return items.reduce((sum, value) => sum + value, 0) / items.length;
}

describe('simulator', () => {
  it('covers days -29 to 180 with no gaps', () => {
    const dataset = generateScenario(normalConfig(1));
    expect(dataset.records).toHaveLength(210);
    expect(dataset.records.map((record) => record.day)).toEqual(
      Array.from({ length: 210 }, (_, i) => -29 + i),
    );
    expect(dataset.synthetic).toBe(true);
  });

  it('gives an identical dataset for the same inputs', () => {
    expect(generateScenario(normalConfig(7))).toEqual(generateScenario(normalConfig(7)));
  });

  it('keeps every non-null value inside its clip range', () => {
    const dataset = generateScenario(normalConfig(3));
    for (const meta of INDICATORS) {
      const params = SIM_PARAMS[meta.id];
      if (params === null) continue;
      const present = values(dataset, meta.id, -29, 180);
      expect(present.length).toBeGreaterThan(0);
      for (const value of present) {
        expect(value).toBeGreaterThanOrEqual(params.clipMin);
        expect(value).toBeLessThanOrEqual(params.clipMax);
      }
    }
  });

  it('has about 2 percent missing values over 100 seeds', () => {
    let total = 0;
    let missing = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const dataset = generateScenario(normalConfig(seed));
      for (const record of dataset.records) {
        for (const meta of INDICATORS) {
          total++;
          if (record.values[meta.id] === null) missing++;
        }
      }
    }
    const fraction = missing / total;
    expect(fraction).toBeGreaterThan(0.01);
    expect(fraction).toBeLessThan(0.03);
  });

  it('shows the early adaptation offset on heart rate over 50 seeds', () => {
    let sum = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const dataset = generateScenario(normalConfig(seed));
      const preflight = mean(values(dataset, 'heart_rate', -29, 0));
      const early = mean(values(dataset, 'heart_rate', 1, 3));
      sum += early - preflight;
    }
    const average = sum / 50;
    expect(average).toBeGreaterThan(2);
    expect(average).toBeLessThan(4);
  });
});
