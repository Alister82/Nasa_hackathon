import { describe, it, expect } from 'vitest';
import { MEASUREMENT_HELP } from './measurementHelp';
import type { IndicatorId } from '@/contracts/types';

// G3 acceptance: all 11 present; no forbidden words (RULES 10); every hazards entry is one of the five names.

const ALL_INDICATORS: IndicatorId[] = [
  'heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose',
  'sleep_hours', 'exercise_minutes', 'mood', 'stress', 'energy', 'radiation_dose',
];

const VALID_HAZARDS = new Set([
  'radiation',
  'isolation and confinement',
  'distance from Earth',
  'altered gravity',
  'hostile closed environment',
]);

// RULES.md 10 forbidden words (lower-cased for comparison).
const FORBIDDEN = [
  'diagnos', 'you have', 'disease', 'cancer', 'depression',
  'anxiety disorder', 'risk score', 'probability of', 'predict',
  'ai doctor',
];

describe('G3: measurement help', () => {
  it('has an entry for all 11 indicators', () => {
    for (const id of ALL_INDICATORS) {
      expect(MEASUREMENT_HELP[id]).toBeDefined();
      expect(MEASUREMENT_HELP[id].indicatorId).toBe(id);
    }
  });

  it('howToMeasure is 1–3 sentences (non-empty string)', () => {
    for (const id of ALL_INDICATORS) {
      const h = MEASUREMENT_HELP[id].howToMeasure;
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
    }
  });

  it('whyItMatters is a non-empty string', () => {
    for (const id of ALL_INDICATORS) {
      const w = MEASUREMENT_HELP[id].whyItMatters;
      expect(typeof w).toBe('string');
      expect(w.length).toBeGreaterThan(0);
    }
  });

  it('every hazards entry is one of the five HRP hazard names', () => {
    for (const id of ALL_INDICATORS) {
      for (const h of MEASUREMENT_HELP[id].hazards) {
        expect(VALID_HAZARDS.has(h)).toBe(true);
      }
    }
  });

  it('hazards arrays are non-empty', () => {
    for (const id of ALL_INDICATORS) {
      expect(MEASUREMENT_HELP[id].hazards.length).toBeGreaterThan(0);
    }
  });

  it('no forbidden words in any text', () => {
    for (const id of ALL_INDICATORS) {
      const entry = MEASUREMENT_HELP[id];
      const allText = [entry.howToMeasure, entry.whyItMatters, ...entry.hazards].join(' ').toLowerCase();
      for (const word of FORBIDDEN) {
        expect(allText, `"${word}" found in ${id}`).not.toContain(word);
      }
    }
  });
});

