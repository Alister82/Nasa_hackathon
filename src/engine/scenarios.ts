import type {
  CrewDataset, GroundTruthEvent, IndicatorId, ScenarioConfig, ScenarioId,
} from '@/contracts/types';
import type { IndicatorEffect, ScenarioDefinition } from './simulator';
import { simulateDataset } from './simulator';

/** Slow-drift effects, ARCHITECTURE.md 6.5. */
const DRIFT_INDICATORS: IndicatorId[] = [
  'heart_rate', 'bp_sys', 'bp_dia', 'sleep_hours',
  'mood', 'stress', 'energy', 'exercise_minutes',
];

function driftEffects(onsetDay: number): IndicatorEffect[] {
  return [
    { indicatorId: 'heart_rate', magnitude: 9, onsetDay, rampDays: 40 },
    { indicatorId: 'bp_sys', magnitude: 8, onsetDay, rampDays: 40 },
    { indicatorId: 'bp_dia', magnitude: 5, onsetDay, rampDays: 40 },
    { indicatorId: 'sleep_hours', magnitude: -1.2, onsetDay, rampDays: 40 },
    { indicatorId: 'mood', magnitude: -0.9, onsetDay, rampDays: 40 },
    { indicatorId: 'stress', magnitude: 0.9, onsetDay, rampDays: 40 },
    { indicatorId: 'energy', magnitude: -0.7, onsetDay, rampDays: 40 },
    { indicatorId: 'exercise_minutes', magnitude: -25, onsetDay, rampDays: 40 },
  ];
}

function driftGroundTruth(onsetDay: number): GroundTruthEvent[] {
  return [
    {
      kind: 'physiological_drift',
      isMedical: true,
      onsetDay,
      endDay: null,
      indicators: [...DRIFT_INDICATORS],
    },
  ];
}

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  normal_adaptation: {
    scenarioId: 'normal_adaptation',
    groundTruth: [],
    effects: [],
  },
  slow_drift: {
    scenarioId: 'slow_drift',
    groundTruth: driftGroundTruth(70),
    effects: driftEffects(70),
  },
  sensor_fault: {
    scenarioId: 'sensor_fault',
    groundTruth: [
      { kind: 'sensor_fault', isMedical: false, onsetDay: 90, endDay: 92, indicators: ['heart_rate'] },
    ],
    effects: [],
    heartRateSpike: { day: 90, offsetFromCrewBase: 45 },
    forcedNullIndicatorDays: [{ indicatorId: 'heart_rate', days: [91, 92] }],
  },
  blackout_drift: {
    scenarioId: 'blackout_drift',
    groundTruth: driftGroundTruth(95),
    effects: driftEffects(95),
    forcedNullDays: [100, 101, 102, 103, 104, 105, 106, 107],
  },
  solar_event: {
    scenarioId: 'solar_event',
    groundTruth: [
      { kind: 'solar_event', isMedical: true, onsetDay: 80, endDay: 83, indicators: ['radiation_dose'] },
    ],
    effects: [],
    radiationEvent: { onsetDay: 80, endDay: 83, factor: 6 },
  },
  acute_fever: {
    scenarioId: 'acute_fever',
    groundTruth: [
      {
        kind: 'acute_illness',
        isMedical: true,
        onsetDay: 120,
        endDay: 124,
        indicators: ['body_temp', 'heart_rate', 'sleep_hours', 'energy'],
      },
    ],
    effects: [
      { indicatorId: 'body_temp', magnitude: 1.5, onsetDay: 120, endDay: 124, rampDays: 1, recoverDays: 2 },
      { indicatorId: 'heart_rate', magnitude: 14, onsetDay: 120, endDay: 124, rampDays: 1, recoverDays: 2 },
      { indicatorId: 'sleep_hours', magnitude: -1.5, onsetDay: 120, endDay: 124, rampDays: 1, recoverDays: 2 },
      { indicatorId: 'energy', magnitude: -1.0, onsetDay: 120, endDay: 124, rampDays: 1, recoverDays: 2 },
    ],
  },
};

export function getScenarioDefinition(scenarioId: ScenarioId): ScenarioDefinition {
  return SCENARIOS[scenarioId];
}

export function generateScenario(config: ScenarioConfig): CrewDataset {
  return simulateDataset(config, getScenarioDefinition(config.scenarioId));
}
