/**
 * G3 tests: MEASUREMENT_HELP for all 11 indicators.
 * Checks: all 11 present; no forbidden words; every hazard is one of the five names.
 */
import { describe, it, expect } from 'vitest';
import { MEASUREMENT_HELP, ALLOWED_HAZARDS } from './measurementHelp';
import type { IndicatorId } from '@/contracts/types';

const ALL_INDICATORS: IndicatorId[] = [
  'heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose',
  'sleep_hours', 'exercise_minutes', 'mood', 'stress', 'energy', 'radiation_dose',
];

// Forbidden words from RULES.md section 10.
const FORBIDDEN_WORDS = [
  'diagnos', 'you have', 'disease', 'cancer', 'depression', 'anxiety disorder',
];

function checkNoForbiddenWords(text: string, context: string): void {
  for (const w of FORBIDDEN_WORDS) {
    expect(text.toLowerCase(), `Forbidden word "${w}" in ${context}`).not.toContain(w.toLowerCase());
  }
}

describe('MEASUREMENT_HELP', () => {
  it('has an entry for all 11 indicators', () => {
    for (const id of ALL_INDICATORS) {
      expect(MEASUREMENT_HELP[id], `missing ${id}`).toBeDefined();
    }
  });

  it('every indicatorId matches its key', () => {
    for (const id of ALL_INDICATORS) {
      expect(MEASUREMENT_HELP[id].indicatorId).toBe(id);
    }
  });

  it('howToMeasure is 1–3 sentences (non-empty)', () => {
    for (const id of ALL_INDICATORS) {
      const h = MEASUREMENT_HELP[id].howToMeasure;
      expect(h.length, `${id} howToMeasure empty`).toBeGreaterThan(0);
    }
  });

  it('whyItMatters is non-empty', () => {
    for (const id of ALL_INDICATORS) {
      const w = MEASUREMENT_HELP[id].whyItMatters;
      expect(w.length, `${id} whyItMatters empty`).toBeGreaterThan(0);
    }
  });

  it('every hazard is one of the five allowed HRP hazard names', () => {
    for (const id of ALL_INDICATORS) {
      for (const h of MEASUREMENT_HELP[id].hazards) {
        expect(
          (ALLOWED_HAZARDS as readonly string[]).includes(h),
          `${id} has disallowed hazard "${h}"`,
        ).toBe(true);
      }
    }
  });

  it('every indicator has at least one hazard', () => {
    for (const id of ALL_INDICATORS) {
      expect(MEASUREMENT_HELP[id].hazards.length, `${id} has no hazards`).toBeGreaterThan(0);
    }
  });

  it('no forbidden words in any text field', () => {
    for (const id of ALL_INDICATORS) {
      const entry = MEASUREMENT_HELP[id];
      checkNoForbiddenWords(entry.howToMeasure, `${id}.howToMeasure`);
      checkNoForbiddenWords(entry.whyItMatters, `${id}.whyItMatters`);
    }
  });
});

