import type { ScenarioId, MissionSettingId } from './types';

export const APP_NAME = 'Vigil';
export const PREFLIGHT_DAYS = 30;
export const MISSION_DAYS = 180;
export const FIRST_PREFLIGHT_DAY = -29;

export const EVALUATION_SEEDS = { start: 1, end: 100 } as const;
export const TUNING_SEEDS = { start: 1000, end: 1099 } as const;

export const SCENARIO_IDS: ScenarioId[] = [
  'normal_adaptation', 'slow_drift', 'sensor_fault',
  'blackout_drift', 'solar_event', 'acute_fever',
];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  normal_adaptation: 'Normal adaptation',
  slow_drift: 'Slow multi-signal drift',
  sensor_fault: 'Sensor fault',
  blackout_drift: 'Drift during a communication blackout',
  solar_event: 'Solar radiation event',
  acute_fever: 'Acute fever',
};

export interface DefaultCrew {
  crewId: string;
  crewName: string;
  scenarioId: ScenarioId;
  seed: number;
}

export const DEFAULT_CREW: DefaultCrew[] = [
  { crewId: 'crew-1', crewName: 'Crew 1', scenarioId: 'slow_drift', seed: 42 },
  { crewId: 'crew-2', crewName: 'Crew 2', scenarioId: 'normal_adaptation', seed: 43 },
  { crewId: 'crew-3', crewName: 'Crew 3', scenarioId: 'sensor_fault', seed: 44 },
];

export const DEFAULT_MISSION_SETTING: MissionSettingId = 'deep_space';
export const DEFAULT_VIEW_DAY = 120;

export const DEMO_STORY = {
  crewId: 'crew-1',
  scenarioId: 'slow_drift' as ScenarioId,
  seed: 42,
  missionSetting: 'deep_space' as MissionSettingId,
  viewDay: 120,
};

export const DISCLAIMER_BANNER =
  'Simulated crew data. Decision support only, not a medical device.';
