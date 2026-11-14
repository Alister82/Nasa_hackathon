import { describe, expect, it } from 'vitest';
import type { MeasurementEntry } from '@/contracts/types';
import { generateScenario, mergeEntries, truncateDataset } from './index';

const dataset = generateScenario({
  scenarioId: 'normal_adaptation',
  seed: 11,
  crewId: 'crew-1',
  crewName: 'Crew 1',
  missionSetting: 'deep_space',
});

function entry(day: number, heartRate: number): MeasurementEntry {
  return { crewId: 'crew-1', day, values: { heart_rate: heartRate }, createdAt: '2026-11-14T00:00:00.000Z' };
}

describe('mergeEntries', () => {
  it('overwrites only the provided values', () => {
    const before = dataset.records.find((record) => record.day === 10);
    const merged = mergeEntries(dataset, [entry(10, 150)]);
    const after = merged.records.find((record) => record.day === 10);
    expect(after?.values.heart_rate).toBe(150);
    expect(after?.values.bp_sys).toBe(before?.values.bp_sys);
    expect(dataset.records.find((record) => record.day === 10)?.values.heart_rate).toBe(before?.values.heart_rate);
  });

  it('applies later entries over earlier ones for the same day', () => {
    const merged = mergeEntries(dataset, [entry(12, 100), entry(12, 120)]);
    expect(merged.records.find((record) => record.day === 12)?.values.heart_rate).toBe(120);
  });

  it('ignores entries outside days -29 to 180', () => {
    const merged = mergeEntries(dataset, [entry(181, 150), entry(-30, 150)]);
    expect(merged.records.some((record) => record.day === 181)).toBe(false);
    expect(merged.records.some((record) => record.day === -30)).toBe(false);
    expect(merged.records.map((record) => record.day)).toEqual(dataset.records.map((record) => record.day));
  });
});

describe('truncateDataset', () => {
  it('keeps only records on or before the given day', () => {
    const truncated = truncateDataset(dataset, 90);
    expect(truncated.records.every((record) => record.day <= 90)).toBe(true);
    expect(truncated.records[truncated.records.length - 1]?.day).toBe(90);
    expect(truncated.records).toHaveLength(30 + 90);
  });

  it('does not change the source dataset', () => {
    truncateDataset(dataset, 30);
    expect(dataset.records).toHaveLength(210);
  });
});
