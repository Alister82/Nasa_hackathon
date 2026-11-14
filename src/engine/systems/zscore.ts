import type { CrewDataset, DailyFlag, DailyRecord } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { radiationFlagDays } from './radiationRule';

const WINDOW_DAYS = 14;
const MIN_VALUES = 7;
const Z_LIMIT = 3;

/** Rolling 14-day z-score alerter, ARCHITECTURE.md 6.7. */
export function zscoreFlagDays(dataset: CrewDataset): DailyFlag[] {
  const recordsByDay = new Map<number, DailyRecord>();
  for (const record of dataset.records) recordsByDay.set(record.day, record);
  const radiation = radiationFlagDays(dataset);
  const flags: DailyFlag[] = [];

  for (let day = 1; day <= dataset.missionDays; day++) {
    let flagged = false;
    for (const meta of INDICATORS) {
      if (meta.method !== 'cusum') continue;
      const raw = recordsByDay.get(day)?.values[meta.id];
      if (typeof raw !== 'number') continue;

      const window: number[] = [];
      for (let d = day - WINDOW_DAYS; d < day; d++) {
        const value = recordsByDay.get(d)?.values[meta.id];
        if (typeof value === 'number') window.push(value);
      }
      if (window.length < MIN_VALUES) continue;

      const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
      const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / window.length;
      const sd = Math.max(Math.sqrt(variance), meta.minSigma);
      const z = (raw - mean) / sd;

      if (meta.concernDirection === 'up' && z > Z_LIMIT) flagged = true;
      else if (meta.concernDirection === 'down' && z < -Z_LIMIT) flagged = true;
      else if (meta.concernDirection === 'both' && Math.abs(z) > Z_LIMIT) flagged = true;
      if (flagged) break;
    }
    if (!flagged) flagged = radiation[day - 1]?.flagged ?? false;
    flags.push({ day, flagged });
  }
  return flags;
}
