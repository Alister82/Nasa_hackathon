import type { DailyRecord, IndicatorId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';

/**
 * Applies independent missing values with a supplied deterministic stream.
 * Draw order is fixed by INDICATORS so the same seed always degrades the same way.
 */
export function applyMissingness(
  records: DailyRecord[],
  stream: () => number,
  probability: (indicatorId: IndicatorId) => number,
): DailyRecord[] {
  const next = records.map((record) => ({ day: record.day, values: { ...record.values } }));
  for (const meta of INDICATORS) {
    const p = probability(meta.id);
    for (const record of next) {
      if (record.values[meta.id] === undefined) continue;
      if (stream() < p) record.values[meta.id] = null;
    }
  }
  return next;
}

/** Sets a given set of days to null, for one indicator or for every indicator (blackout). */
export function applyForcedNulls(
  records: DailyRecord[],
  days: number[],
  indicatorId?: IndicatorId,
): DailyRecord[] {
  const daySet = new Set(days);
  return records.map((record) => {
    const values = { ...record.values };
    if (daySet.has(record.day)) {
      if (indicatorId === undefined) {
        for (const meta of INDICATORS) values[meta.id] = null;
      } else {
        values[indicatorId] = null;
      }
    }
    return { day: record.day, values };
  });
}
