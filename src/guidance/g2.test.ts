/**
 * G2 tests: REFERENCE_RANGES and classifyValue.
 * Table-driven boundary tests per ARCHITECTURE.md 7.1.
 * Every boundary value from the acceptance criteria is covered.
 */
import { describe, it, expect } from 'vitest';
import { REFERENCE_RANGES, classifyValue } from './referenceRanges';
import { SOURCES } from './sources';
import type { IndicatorId } from '@/contracts/types';

// ── REFERENCE_RANGES ──────────────────────────────────────────────────────────

describe('REFERENCE_RANGES', () => {
  const ALL_INDICATORS: IndicatorId[] = [
    'heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose',
    'sleep_hours', 'exercise_minutes', 'mood', 'stress', 'energy', 'radiation_dose',
  ];

  it('has an entry for all 11 indicators', () => {
    for (const id of ALL_INDICATORS) {
      expect(REFERENCE_RANGES[id], `missing ${id}`).toBeDefined();
    }
  });

  it('every entry is marked illustrative', () => {
    for (const r of Object.values(REFERENCE_RANGES)) {
      expect(r.illustrative).toBe(true);
    }
  });

  it('every source id referenced exists in SOURCES', () => {
    for (const r of Object.values(REFERENCE_RANGES)) {
      for (const sid of r.sourceIds) {
        expect(SOURCES[sid], `${r.indicatorId} references unknown source ${sid}`).toBeDefined();
      }
    }
  });

  it('every entry has a non-empty displayText', () => {
    for (const r of Object.values(REFERENCE_RANGES)) {
      expect(r.displayText.length).toBeGreaterThan(0);
    }
  });
});

// ── classifyValue: boundary tables ───────────────────────────────────────────

type BoundaryCase = { value: number; expected: ReturnType<typeof classifyValue> };

function runTable(id: IndicatorId, cases: BoundaryCase[]): void {
  for (const c of cases) {
    it(`${id} ${c.value} → ${c.expected}`, () => {
      expect(classifyValue(id, c.value)).toBe(c.expected);
    });
  }
}

// heart_rate: normal 60–100; borderline 50–59 or 101–110; out_of_range <50 or >110
describe('classifyValue heart_rate', () => {
  runTable('heart_rate', [
    { value: 49, expected: 'out_of_range' },
    { value: 50, expected: 'borderline' },
    { value: 59, expected: 'borderline' },
    { value: 60, expected: 'normal' },
    { value: 100, expected: 'normal' },
    { value: 101, expected: 'borderline' },
    { value: 110, expected: 'borderline' },
    { value: 111, expected: 'out_of_range' },
  ]);
});

// bp_sys: urgent ≥180; out_of_range 140–179 or <80; borderline 120–139 or 80–89; normal 90–119
describe('classifyValue bp_sys', () => {
  runTable('bp_sys', [
    { value: 79, expected: 'out_of_range' },
    { value: 80, expected: 'borderline' },
    { value: 89, expected: 'borderline' },
    { value: 90, expected: 'normal' },
    { value: 119, expected: 'normal' },
    { value: 120, expected: 'borderline' },
    { value: 139, expected: 'borderline' },
    { value: 140, expected: 'out_of_range' },
    { value: 179, expected: 'out_of_range' },
    { value: 180, expected: 'urgent' },
    { value: 220, expected: 'urgent' },
  ]);
});

// bp_dia: urgent ≥120; out_of_range 90–119 or <50; borderline 80–89 or 50–59; normal 60–79
describe('classifyValue bp_dia', () => {
  runTable('bp_dia', [
    { value: 49, expected: 'out_of_range' },
    { value: 50, expected: 'borderline' },
    { value: 59, expected: 'borderline' },
    { value: 60, expected: 'normal' },
    { value: 79, expected: 'normal' },
    { value: 80, expected: 'borderline' },
    { value: 89, expected: 'borderline' },
    { value: 90, expected: 'out_of_range' },
    { value: 119, expected: 'out_of_range' },
    { value: 120, expected: 'urgent' },
    { value: 150, expected: 'urgent' },
  ]);
});

// body_temp: normal 36.1–37.2; borderline 37.3–37.9 or 35.5–36.0; out_of_range ≥38.0 or <35.5
describe('classifyValue body_temp', () => {
  runTable('body_temp', [
    { value: 35.4, expected: 'out_of_range' },
    { value: 35.5, expected: 'borderline' },
    { value: 36.0, expected: 'borderline' },
    { value: 36.1, expected: 'normal' },
    { value: 37.2, expected: 'normal' },
    { value: 37.3, expected: 'borderline' },
    { value: 37.9, expected: 'borderline' },
    { value: 38.0, expected: 'out_of_range' },
    { value: 39.5, expected: 'out_of_range' },
  ]);
});

// glucose: urgent <54; out_of_range 54–69 or ≥126; borderline 100–125; normal 70–99
describe('classifyValue glucose', () => {
  runTable('glucose', [
    { value: 53, expected: 'urgent' },
    { value: 54, expected: 'out_of_range' },
    { value: 69, expected: 'out_of_range' },
    { value: 70, expected: 'normal' },
    { value: 99, expected: 'normal' },
    { value: 100, expected: 'borderline' },
    { value: 125, expected: 'borderline' },
    { value: 126, expected: 'out_of_range' },
    { value: 300, expected: 'out_of_range' },
  ]);
});

// sleep_hours: normal ≥7; borderline 6.0–6.9; out_of_range <6.0
describe('classifyValue sleep_hours', () => {
  runTable('sleep_hours', [
    { value: 5.9, expected: 'out_of_range' },
    { value: 6.0, expected: 'borderline' },
    { value: 6.9, expected: 'borderline' },
    { value: 7.0, expected: 'normal' },
    { value: 9.0, expected: 'normal' },
  ]);
});

// exercise_minutes: normal ≥96; borderline 60–95; out_of_range <60
describe('classifyValue exercise_minutes', () => {
  runTable('exercise_minutes', [
    { value: 59, expected: 'out_of_range' },
    { value: 60, expected: 'borderline' },
    { value: 95, expected: 'borderline' },
    { value: 96, expected: 'normal' },
    { value: 120, expected: 'normal' },
  ]);
});

// mood: normal ≥3; borderline 2.0–2.9; out_of_range <2.0
describe('classifyValue mood', () => {
  runTable('mood', [
    { value: 1.9, expected: 'out_of_range' },
    { value: 2.0, expected: 'borderline' },
    { value: 2.9, expected: 'borderline' },
    { value: 3.0, expected: 'normal' },
    { value: 5.0, expected: 'normal' },
  ]);
});

// stress: normal ≤3; borderline 3.1–3.9; out_of_range ≥4.0
describe('classifyValue stress', () => {
  runTable('stress', [
    { value: 1.0, expected: 'normal' },
    { value: 3.0, expected: 'normal' },
    { value: 3.1, expected: 'borderline' },
    { value: 3.9, expected: 'borderline' },
    { value: 4.0, expected: 'out_of_range' },
    { value: 5.0, expected: 'out_of_range' },
  ]);
});

// energy: normal ≥3; borderline 2.0–2.9; out_of_range <2.0
describe('classifyValue energy', () => {
  runTable('energy', [
    { value: 1.9, expected: 'out_of_range' },
    { value: 2.0, expected: 'borderline' },
    { value: 2.9, expected: 'borderline' },
    { value: 3.0, expected: 'normal' },
    { value: 5.0, expected: 'normal' },
  ]);
});

// radiation_dose: uses ratio to expected rate. deep_space rate = 1.8 mSv/day.
// normal ≤1.5×rate; borderline 1.5–2.5×rate; out_of_range >2.5×rate
describe('classifyValue radiation_dose', () => {
  // deep_space rate = 1.8; 1.5×1.8 = 2.7; 2.5×1.8 = 4.5
  it('1.8 (1.0×) → normal', () => {
    expect(classifyValue('radiation_dose', 1.8, 'deep_space')).toBe('normal');
  });
  it('2.7 (1.5×) → normal', () => {
    // exactly at boundary — per ARCHITECTURE 7.1 ≤ 1.5× is normal
    expect(classifyValue('radiation_dose', 2.7, 'deep_space')).toBe('normal');
  });
  it('2.71 (just over 1.5×) → borderline', () => {
    expect(classifyValue('radiation_dose', 2.71, 'deep_space')).toBe('borderline');
  });
  it('4.5 (2.5×) → borderline', () => {
    // exactly at boundary — per ARCHITECTURE 7.1 1.5–2.5× is borderline
    expect(classifyValue('radiation_dose', 4.5, 'deep_space')).toBe('borderline');
  });
  it('4.51 (just over 2.5×) → out_of_range', () => {
    expect(classifyValue('radiation_dose', 4.51, 'deep_space')).toBe('out_of_range');
  });
  it('no setting provided → normal (cannot classify without rate)', () => {
    expect(classifyValue('radiation_dose', 100)).toBe('normal');
  });
  it('station rate = 0.5; 1.26 (> 2.5×) → out_of_range', () => {
    expect(classifyValue('radiation_dose', 1.26, 'station')).toBe('out_of_range');
  });
});

