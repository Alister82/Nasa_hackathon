import { describe, expect, it } from 'vitest';
import type { DailyFlag, GroundTruthEvent } from '@/contracts/types';
import { computeRunMetrics } from './metrics';

function flagsFor(days: number[], missionDays = 180): DailyFlag[] {
  return Array.from({ length: missionDays }, (_, index) => ({
    day: index + 1,
    flagged: days.includes(index + 1),
  }));
}

const drift: GroundTruthEvent = {
  kind: 'physiological_drift',
  isMedical: true,
  onsetDay: 50,
  endDay: null,
  indicators: ['heart_rate'],
};

const sensor: GroundTruthEvent = {
  kind: 'sensor_fault',
  isMedical: false,
  onsetDay: 90,
  endDay: 92,
  indicators: ['heart_rate'],
};

describe('metrics', () => {
  it('reports zero episodes and 180 eligible days with no events and no flags', () => {
    const metrics = computeRunMetrics(flagsFor([]), [], 180);
    expect(metrics.eventCount).toBe(0);
    expect(metrics.detectedCount).toBe(0);
    expect(metrics.falseEpisodes).toBe(0);
    expect(metrics.eligibleDays).toBe(180);
  });

  it('counts one episode for a single run of flags', () => {
    expect(computeRunMetrics(flagsFor([10, 11, 12]), [], 180).falseEpisodes).toBe(1);
  });

  it('merges runs separated by two or fewer days', () => {
    expect(computeRunMetrics(flagsFor([10, 11, 12, 15, 16]), [], 180).falseEpisodes).toBe(1);
  });

  it('keeps runs separated by three days apart', () => {
    expect(computeRunMetrics(flagsFor([10, 11, 12, 16, 17]), [], 180).falseEpisodes).toBe(2);
  });

  it('measures detection delay inside the medical event window', () => {
    const metrics = computeRunMetrics(flagsFor([55]), [drift], 180);
    expect(metrics.eventCount).toBe(1);
    expect(metrics.detectedCount).toBe(1);
    expect(metrics.delays).toEqual([5]);
    expect(metrics.falseEpisodes).toBe(0);
    expect(metrics.eligibleDays).toBe(49);
  });

  it('counts flags outside the window as false and ignores a later in-window flag delay', () => {
    const metrics = computeRunMetrics(flagsFor([10, 60]), [drift], 180);
    expect(metrics.delays).toEqual([10]);
    expect(metrics.falseAlarmDays).toEqual([10]);
    expect(metrics.falseEpisodes).toBe(1);
  });

  it('counts a non-medical event window as false alarms', () => {
    const metrics = computeRunMetrics(flagsFor([90, 91, 92]), [sensor], 180);
    expect(metrics.eventCount).toBe(0);
    expect(metrics.detectedCount).toBe(0);
    expect(metrics.falseAlarmDays).toEqual([90, 91, 92]);
    expect(metrics.falseEpisodes).toBe(1);
    expect(metrics.eligibleDays).toBe(180);
  });
});
