import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ResultsFile, SystemId } from '@/contracts/types';
import { SCENARIO_IDS } from '@/contracts/constants';

const SYSTEM_IDS: SystemId[] = ['vigil', 'threshold', 'zscore'];

function loadResults(): ResultsFile {
  const contents = readFileSync(resolve(process.cwd(), 'public/data/results.json'), 'utf8');
  return JSON.parse(contents) as ResultsFile;
}

describe('results file', () => {
  it('matches the frozen schema shape', () => {
    const results = loadResults();
    expect(results.schemaVersion).toBe(1);
    expect(results.contractVersion).toBe(1);
    expect(results.evaluationSeeds).toEqual({ start: 1, end: 100 });
    expect(results.tuningSeeds).toEqual({ start: 1000, end: 1099 });
    expect(results.missionDays).toBe(180);
    expect(results.missionSetting).toBe('deep_space');
    expect(results.scenarios.map((scenario) => scenario.scenarioId)).toEqual(SCENARIO_IDS);
  });

  it('has complete metrics for all three systems in every scenario', () => {
    const results = loadResults();
    for (const scenario of results.scenarios) {
      expect(scenario.seedCount).toBe(100);
      for (const id of SYSTEM_IDS) {
        const metrics = scenario.systems[id];
        expect(metrics).toBeDefined();
        expect(metrics.eventCount).toBeGreaterThanOrEqual(0);
        expect(metrics.detectedCount).toBeGreaterThanOrEqual(0);
        expect(metrics.detectedCount).toBeLessThanOrEqual(metrics.eventCount);
        expect(metrics.falseEpisodes).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(metrics.falseAlarmsPer100Days)).toBe(true);
        expect(metrics.falseAlarmsPer100Days).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
