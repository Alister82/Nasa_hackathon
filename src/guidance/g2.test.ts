import { describe, it, expect } from 'vitest';
import { classifyValue, REFERENCE_RANGES } from './referenceRanges';
import type { IndicatorId } from '@/contracts/types';

// G2 acceptance: table-driven tests for every row including boundary values per ARCHITECTURE.md 7.1.

describe('G2: REFERENCE_RANGES', () => {
  const ALL_INDICATORS: IndicatorId[] = [
    'heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose',
    'sleep_hours', 'exercise_minutes', 'mood', 'stress', 'energy', 'radiation_dose',
  ];

  it('has an entry for all 11 indicators', () => {
    for (const id of ALL_INDICATORS) {
      expect(REFERENCE_RANGES[id]).toBeDefined();
      expect(REFERENCE_RANGES[id].indicatorId).toBe(id);
    }
  });

  it('all entries have illustrative: true', () => {
    for (const id of ALL_INDICATORS) {
      expect(REFERENCE_RANGES[id].illustrative).toBe(true);
    }
  });

  it('all entries have at least one sourceId', () => {
    for (const id of ALL_INDICATORS) {
      expect(REFERENCE_RANGES[id].sourceIds.length).toBeGreaterThan(0);
    }
  });
});

describe('G2: classifyValue — heart_rate', () => {
  it('100 → normal (boundary)', () => expect(classifyValue('heart_rate', 100)).toBe('normal'));
  it('60 → normal', () => expect(classifyValue('heart_rate', 60)).toBe('normal'));
  it('80 → normal', () => expect(classifyValue('heart_rate', 80)).toBe('normal'));
  it('101 → borderline (boundary)', () => expect(classifyValue('heart_rate', 101)).toBe('borderline'));
  it('50 → borderline', () => expect(classifyValue('heart_rate', 50)).toBe('borderline'));
  it('59 → borderline', () => expect(classifyValue('heart_rate', 59)).toBe('borderline'));
  it('110 → borderline', () => expect(classifyValue('heart_rate', 110)).toBe('borderline'));
  it('111 → out_of_range', () => expect(classifyValue('heart_rate', 111)).toBe('out_of_range'));
  it('49 → out_of_range', () => expect(classifyValue('heart_rate', 49)).toBe('out_of_range'));
  it('30 → out_of_range', () => expect(classifyValue('heart_rate', 30)).toBe('out_of_range'));
  it('150 → out_of_range', () => expect(classifyValue('heart_rate', 150)).toBe('out_of_range'));
});

describe('G2: classifyValue — bp_sys', () => {
  it('119 → normal', () => expect(classifyValue('bp_sys', 119)).toBe('normal'));
  it('90 → normal', () => expect(classifyValue('bp_sys', 90)).toBe('normal'));
  it('120 → borderline (boundary)', () => expect(classifyValue('bp_sys', 120)).toBe('borderline'));
  it('139 → borderline', () => expect(classifyValue('bp_sys', 139)).toBe('borderline'));
  it('80 → borderline', () => expect(classifyValue('bp_sys', 80)).toBe('borderline'));
  it('89 → borderline', () => expect(classifyValue('bp_sys', 89)).toBe('borderline'));
  it('140 → out_of_range', () => expect(classifyValue('bp_sys', 140)).toBe('out_of_range'));
  it('179 → out_of_range', () => expect(classifyValue('bp_sys', 179)).toBe('out_of_range'));
  it('79 → out_of_range', () => expect(classifyValue('bp_sys', 79)).toBe('out_of_range'));
  it('180 → urgent (boundary)', () => expect(classifyValue('bp_sys', 180)).toBe('urgent'));
  it('200 → urgent', () => expect(classifyValue('bp_sys', 200)).toBe('urgent'));
});

describe('G2: classifyValue — bp_dia', () => {
  it('70 → normal', () => expect(classifyValue('bp_dia', 70)).toBe('normal'));
  it('60 → normal', () => expect(classifyValue('bp_dia', 60)).toBe('normal'));
  it('79 → normal', () => expect(classifyValue('bp_dia', 79)).toBe('normal'));
  it('80 → borderline (boundary)', () => expect(classifyValue('bp_dia', 80)).toBe('borderline'));
  it('89 → borderline', () => expect(classifyValue('bp_dia', 89)).toBe('borderline'));
  it('50 → borderline', () => expect(classifyValue('bp_dia', 50)).toBe('borderline'));
  it('59 → borderline', () => expect(classifyValue('bp_dia', 59)).toBe('borderline'));
  it('90 → out_of_range', () => expect(classifyValue('bp_dia', 90)).toBe('out_of_range'));
  it('119 → out_of_range', () => expect(classifyValue('bp_dia', 119)).toBe('out_of_range'));
  it('49 → out_of_range', () => expect(classifyValue('bp_dia', 49)).toBe('out_of_range'));
  it('120 → urgent (boundary)', () => expect(classifyValue('bp_dia', 120)).toBe('urgent'));
  it('130 → urgent', () => expect(classifyValue('bp_dia', 130)).toBe('urgent'));
});

describe('G2: classifyValue — body_temp', () => {
  it('36.6 → normal', () => expect(classifyValue('body_temp', 36.6)).toBe('normal'));
  it('36.1 → normal (boundary)', () => expect(classifyValue('body_temp', 36.1)).toBe('normal'));
  it('37.2 → normal (boundary)', () => expect(classifyValue('body_temp', 37.2)).toBe('normal'));
  it('37.3 → borderline (boundary)', () => expect(classifyValue('body_temp', 37.3)).toBe('borderline'));
  it('37.9 → borderline', () => expect(classifyValue('body_temp', 37.9)).toBe('borderline'));
  it('35.5 → borderline', () => expect(classifyValue('body_temp', 35.5)).toBe('borderline'));
  it('36.0 → borderline', () => expect(classifyValue('body_temp', 36.0)).toBe('borderline'));
  it('38.0 → out_of_range', () => expect(classifyValue('body_temp', 38.0)).toBe('out_of_range'));
  it('35.4 → out_of_range', () => expect(classifyValue('body_temp', 35.4)).toBe('out_of_range'));
  it('40.0 → out_of_range', () => expect(classifyValue('body_temp', 40.0)).toBe('out_of_range'));
});

describe('G2: classifyValue — glucose', () => {
  it('85 → normal', () => expect(classifyValue('glucose', 85)).toBe('normal'));
  it('70 → normal (boundary)', () => expect(classifyValue('glucose', 70)).toBe('normal'));
  it('99 → normal', () => expect(classifyValue('glucose', 99)).toBe('normal'));
  it('100 → borderline (boundary)', () => expect(classifyValue('glucose', 100)).toBe('borderline'));
  it('125 → borderline', () => expect(classifyValue('glucose', 125)).toBe('borderline'));
  it('126 → out_of_range (boundary)', () => expect(classifyValue('glucose', 126)).toBe('out_of_range'));
  it('54 → out_of_range (boundary)', () => expect(classifyValue('glucose', 54)).toBe('out_of_range'));
  it('69 → out_of_range', () => expect(classifyValue('glucose', 69)).toBe('out_of_range'));
  it('53 → urgent (boundary)', () => expect(classifyValue('glucose', 53)).toBe('urgent'));
  it('40 → urgent', () => expect(classifyValue('glucose', 40)).toBe('urgent'));
  it('200 → out_of_range', () => expect(classifyValue('glucose', 200)).toBe('out_of_range'));
});

describe('G2: classifyValue — sleep_hours', () => {
  it('8 → normal', () => expect(classifyValue('sleep_hours', 8)).toBe('normal'));
  it('7 → normal (boundary)', () => expect(classifyValue('sleep_hours', 7)).toBe('normal'));
  it('6.9 → borderline', () => expect(classifyValue('sleep_hours', 6.9)).toBe('borderline'));
  it('6.0 → borderline (boundary)', () => expect(classifyValue('sleep_hours', 6.0)).toBe('borderline'));
  it('5.9 → out_of_range', () => expect(classifyValue('sleep_hours', 5.9)).toBe('out_of_range'));
  it('4.0 → out_of_range', () => expect(classifyValue('sleep_hours', 4.0)).toBe('out_of_range'));
});

describe('G2: classifyValue — exercise_minutes', () => {
  it('120 → normal', () => expect(classifyValue('exercise_minutes', 120)).toBe('normal'));
  it('96 → normal (boundary)', () => expect(classifyValue('exercise_minutes', 96)).toBe('normal'));
  it('95 → borderline (boundary)', () => expect(classifyValue('exercise_minutes', 95)).toBe('borderline'));
  it('60 → borderline (boundary)', () => expect(classifyValue('exercise_minutes', 60)).toBe('borderline'));
  it('59 → out_of_range', () => expect(classifyValue('exercise_minutes', 59)).toBe('out_of_range'));
  it('0 → out_of_range', () => expect(classifyValue('exercise_minutes', 0)).toBe('out_of_range'));
});

describe('G2: classifyValue — mood', () => {
  it('3 → normal (boundary)', () => expect(classifyValue('mood', 3)).toBe('normal'));
  it('5 → normal', () => expect(classifyValue('mood', 5)).toBe('normal'));
  it('2.9 → borderline', () => expect(classifyValue('mood', 2.9)).toBe('borderline'));
  it('2.0 → borderline (boundary)', () => expect(classifyValue('mood', 2.0)).toBe('borderline'));
  it('1.9 → out_of_range', () => expect(classifyValue('mood', 1.9)).toBe('out_of_range'));
  it('1 → out_of_range', () => expect(classifyValue('mood', 1)).toBe('out_of_range'));
});

describe('G2: classifyValue — stress', () => {
  it('3 → normal (boundary)', () => expect(classifyValue('stress', 3)).toBe('normal'));
  it('1 → normal', () => expect(classifyValue('stress', 1)).toBe('normal'));
  it('3.5 → borderline', () => expect(classifyValue('stress', 3.5)).toBe('borderline'));
  it('3.1 → borderline (boundary above 3)', () => expect(classifyValue('stress', 3.1)).toBe('borderline'));
  it('4.0 → out_of_range (boundary)', () => expect(classifyValue('stress', 4.0)).toBe('out_of_range'));
  it('5 → out_of_range', () => expect(classifyValue('stress', 5)).toBe('out_of_range'));
});

describe('G2: classifyValue — energy', () => {
  it('3 → normal (boundary)', () => expect(classifyValue('energy', 3)).toBe('normal'));
  it('5 → normal', () => expect(classifyValue('energy', 5)).toBe('normal'));
  it('2.9 → borderline', () => expect(classifyValue('energy', 2.9)).toBe('borderline'));
  it('2.0 → borderline (boundary)', () => expect(classifyValue('energy', 2.0)).toBe('borderline'));
  it('1.9 → out_of_range', () => expect(classifyValue('energy', 1.9)).toBe('out_of_range'));
  it('1 → out_of_range', () => expect(classifyValue('energy', 1)).toBe('out_of_range'));
});

describe('G2: classifyValue — radiation_dose', () => {
  // deep_space rate = 1.8 mSv/day
  it('≤1.5× rate → normal (deep_space)', () => {
    // 1.5 × 1.8 = 2.7 exactly on boundary
    expect(classifyValue('radiation_dose', 2.7, 'deep_space')).toBe('normal');
  });
  it('>1.5× and ≤2.5× rate → borderline (deep_space)', () => {
    // 2.0 × 1.8 = 3.6
    expect(classifyValue('radiation_dose', 3.6, 'deep_space')).toBe('borderline');
  });
  it('>2.5× rate → out_of_range (deep_space)', () => {
    // 3.0 × 1.8 = 5.4
    expect(classifyValue('radiation_dose', 5.4, 'deep_space')).toBe('out_of_range');
  });
  // station rate = 0.5
  it('normal for station at 0.5 × 1.0 = 0.5', () => {
    expect(classifyValue('radiation_dose', 0.5, 'station')).toBe('normal');
  });
  it('out_of_range for station at 2.6 × 0.5 = 1.3', () => {
    expect(classifyValue('radiation_dose', 1.3, 'station')).toBe('out_of_range');
  });
});

