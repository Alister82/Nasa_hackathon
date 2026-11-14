import type {
  CrewDataset, ScenarioConfig, AnalysisResult, DetectionSystem, SystemId,
  MeasurementEntry, ScenarioResult, ResultsFile, ScenarioId, IndicatorId,
  DailyFlag,
} from '@/contracts/types';

/* Checkpoint 0 stub. P1 replaces these bodies in E1 to E9. */

const NOT_IMPLEMENTED = 'not implemented';

export function generateScenario(_config: ScenarioConfig): CrewDataset {
  throw new Error(NOT_IMPLEMENTED);
}

export function mergeEntries(_dataset: CrewDataset, _entries: MeasurementEntry[]): CrewDataset {
  throw new Error(NOT_IMPLEMENTED);
}

export function truncateDataset(_dataset: CrewDataset, _upToDay: number): CrewDataset {
  throw new Error(NOT_IMPLEMENTED);
}

export function analyze(_dataset: CrewDataset, _upToDay: number): AnalysisResult {
  throw new Error(NOT_IMPLEMENTED);
}

function stubSystem(id: SystemId, label: string): DetectionSystem {
  return {
    id,
    label,
    run: (_dataset: CrewDataset): DailyFlag[] => {
      throw new Error(NOT_IMPLEMENTED);
    },
  };
}

// Labels from DESIGN.md section 4.5.
export const SYSTEMS: Record<SystemId, DetectionSystem> = {
  vigil: stubSystem('vigil', 'Vigil'),
  threshold: stubSystem('threshold', 'Fixed thresholds'),
  zscore: stubSystem('zscore', 'Rolling z-score'),
};

export function evaluateScenario(
  _scenarioId: ScenarioId,
  _seeds: number[],
  _missionSetting: ScenarioConfig['missionSetting'],
): ScenarioResult {
  throw new Error(NOT_IMPLEMENTED);
}

export function buildResultsFile(
  _seedsStart: number,
  _seedsEnd: number,
  _missionSetting: ScenarioConfig['missionSetting'],
): ResultsFile {
  throw new Error(NOT_IMPLEMENTED);
}

export function phaseOffset(_indicatorId: IndicatorId, _missionDay: number): number {
  throw new Error(NOT_IMPLEMENTED);
}
