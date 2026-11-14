import type {
  CrewDataset, ScenarioConfig, DetectionSystem, SystemId, MeasurementEntry,
  ScenarioResult, ResultsFile, ScenarioId, MissionSettingId,
} from '@/contracts/types';
import { INDICATOR_IDS } from '@/contracts/indicators';
import { buildResultsFileWith, evaluateScenarioWith } from './metrics';
import { thresholdFlagDays } from './systems/threshold';
import { vigilFlagDays } from './systems/vigil';
import { zscoreFlagDays } from './systems/zscore';

export { analyze } from './detector';
export { phaseOffset } from './simulator';
export { generateScenario } from './scenarios';
export { evaluateFollowUp } from './followUp';

/** Entry values overwrite that day's values; entries outside -29..180 are ignored. */
export function mergeEntries(dataset: CrewDataset, entries: MeasurementEntry[]): CrewDataset {
  const entriesByDay = new Map<number, MeasurementEntry[]>();
  for (const entry of entries) {
    const list = entriesByDay.get(entry.day);
    if (list) list.push(entry);
    else entriesByDay.set(entry.day, [entry]);
  }
  const records = dataset.records.map((record) => {
    const values = { ...record.values };
    const dayEntries = entriesByDay.get(record.day);
    if (dayEntries) {
      for (const entry of dayEntries) {
        for (const id of INDICATOR_IDS) {
          const value = entry.values[id];
          if (typeof value === 'number') values[id] = value;
        }
      }
    }
    return { day: record.day, values };
  });
  return { ...dataset, records };
}

export function truncateDataset(dataset: CrewDataset, upToDay: number): CrewDataset {
  return {
    ...dataset,
    records: dataset.records
      .filter((record) => record.day <= upToDay)
      .map((record) => ({ day: record.day, values: { ...record.values } })),
  };
}

// Labels from DESIGN.md section 4.5.
export const SYSTEMS: Record<SystemId, DetectionSystem> = {
  vigil: { id: 'vigil', label: 'Vigil', run: vigilFlagDays },
  threshold: { id: 'threshold', label: 'Fixed thresholds', run: thresholdFlagDays },
  zscore: { id: 'zscore', label: 'Rolling z-score', run: zscoreFlagDays },
};

export function evaluateScenario(
  scenarioId: ScenarioId,
  seeds: number[],
  missionSetting: MissionSettingId,
): ScenarioResult {
  return evaluateScenarioWith(scenarioId, seeds, missionSetting, SYSTEMS);
}

export function buildResultsFile(
  seedsStart: number,
  seedsEnd: number,
  missionSetting: MissionSettingId,
): ResultsFile {
  return buildResultsFileWith(seedsStart, seedsEnd, missionSetting, SYSTEMS);
}

export type { ScenarioConfig };
