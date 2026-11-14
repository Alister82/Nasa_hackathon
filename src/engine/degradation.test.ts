import { describe, expect, it } from 'vitest';
import type { DailyRecord, IndicatorId } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { applyForcedNulls, applyMissingness } from './degradation';

function records(): DailyRecord[] {
  return [-1, 0, 1, 2].map((day) => {
    const values: Partial<Record<IndicatorId, number | null>> = {};
    for (const meta of INDICATORS) values[meta.id] = 1;
    return { day, values };
  });
}

describe('degradation', () => {
  it('nulls only the requested indicator and day for a sensor dropout', () => {
    const result = applyForcedNulls(records(), [1], 'heart_rate');
    const day = result.find((record) => record.day === 1);
    expect(day?.values.heart_rate).toBeNull();
    expect(day?.values.bp_sys).toBe(1);
    expect(result.find((record) => record.day === 2)?.values.heart_rate).toBe(1);
  });

  it('nulls every indicator on blackout days', () => {
    const result = applyForcedNulls(records(), [2]);
    const day = result.find((record) => record.day === 2);
    for (const meta of INDICATORS) expect(day?.values[meta.id]).toBeNull();
  });

  it('keeps all values when the missing stream never fires', () => {
    const result = applyMissingness(records(), () => 0.99, () => 0.02);
    for (const record of result) {
      for (const meta of INDICATORS) expect(record.values[meta.id]).toBe(1);
    }
  });

  it('nulls all values when the missing stream always fires', () => {
    const result = applyMissingness(records(), () => 0, () => 0.02);
    for (const record of result) {
      for (const meta of INDICATORS) expect(record.values[meta.id]).toBeNull();
    }
  });

  it('does not mutate the input records', () => {
    const input = records();
    applyForcedNulls(input, [1], 'heart_rate');
    applyMissingness(input, () => 0, () => 0.02);
    expect(input[2]?.values.heart_rate).toBe(1);
  });
});
