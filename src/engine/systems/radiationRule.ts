import type { CrewDataset, DailyFlag, DailyRecord } from '@/contracts/types';
import { RADIATION_FLAG_RATIO, RADIATION_WINDOW_DAYS } from '../detectorConfig';
import { RADIATION_RATES } from '../simulator';

/** Shared radiation rule used by all three systems, ARCHITECTURE.md 6.7. */
export function radiationFlagDays(dataset: CrewDataset): DailyFlag[] {
  const expected = RADIATION_RATES[dataset.missionSetting];
  const recordsByDay = new Map<number, DailyRecord>();
  for (const record of dataset.records) recordsByDay.set(record.day, record);

  const flags: DailyFlag[] = [];
  for (let day = 1; day <= dataset.missionDays; day++) {
    let flagged = false;
    for (let d = day; d >= Math.max(1, day - RADIATION_WINDOW_DAYS + 1); d--) {
      const value = recordsByDay.get(d)?.values.radiation_dose;
      if (typeof value === 'number' && value > RADIATION_FLAG_RATIO * expected) {
        flagged = true;
        break;
      }
    }
    flags.push({ day, flagged });
  }
  return flags;
}
