import type { CrewDataset, DailyFlag, IndicatorId } from '@/contracts/types';
import { radiationFlagDays } from './radiationRule';

interface ThresholdRule {
  indicatorId: IndicatorId;
  test: (value: number) => boolean;
}

/** Fixed one-day thresholds, ARCHITECTURE.md 6.7. */
const RULES: ThresholdRule[] = [
  { indicatorId: 'heart_rate', test: (value) => value > 100 || value < 45 },
  { indicatorId: 'bp_sys', test: (value) => value >= 140 },
  { indicatorId: 'bp_dia', test: (value) => value >= 90 },
  { indicatorId: 'body_temp', test: (value) => value >= 38.0 },
  { indicatorId: 'glucose', test: (value) => value >= 126 || value < 70 },
  { indicatorId: 'sleep_hours', test: (value) => value < 5.0 },
  { indicatorId: 'exercise_minutes', test: (value) => value < 30 },
  { indicatorId: 'mood', test: (value) => value <= 2 },
  { indicatorId: 'stress', test: (value) => value >= 4 },
  { indicatorId: 'energy', test: (value) => value <= 2 },
];

export function thresholdFlagDays(dataset: CrewDataset): DailyFlag[] {
  const radiation = radiationFlagDays(dataset);
  return dataset.records
    .filter((record) => record.day >= 1 && record.day <= dataset.missionDays)
    .map((record) => {
      let flagged = RULES.some((rule) => {
        const value = record.values[rule.indicatorId];
        return typeof value === 'number' && rule.test(value);
      });
      if (!flagged) flagged = radiation[record.day - 1]?.flagged ?? false;
      return { day: record.day, flagged };
    });
}
