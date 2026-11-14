/**
 * G2: referenceRanges.ts
 * REFERENCE_RANGES and classifyValue per ARCHITECTURE.md 7.1.
 * All values are ILLUSTRATIVE until a human verifies them.
 *
 * Boundaries are inclusive on the lower end of the next category
 * (ARCHITECTURE.md 7.1 note: "e.g. heart_rate 100 is normal, 101 is borderline").
 *
 * For radiation_dose, classifyValue requires the mission setting so it can
 * compute the expected rate. If setting is not supplied, returns 'normal'.
 */
import type {
  IndicatorId, MissionSettingId, ReferenceRange, ValueClass,
} from '@/contracts/types';
import { MISSION_SETTINGS } from './missionSettings';

// ── Display text per indicator ───────────────────────────────────────────────

export const REFERENCE_RANGES: Record<IndicatorId, ReferenceRange> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    displayText: '60 to 100 bpm at rest',
    sourceIds: ['src_general_clinical'],
    illustrative: true,
  },
  bp_sys: {
    indicatorId: 'bp_sys',
    displayText: 'below 120 mmHg (and at least 90 mmHg)',
    sourceIds: ['src_aha_acc_bp'],
    illustrative: true,
  },
  bp_dia: {
    indicatorId: 'bp_dia',
    displayText: 'below 80 mmHg (and at least 60 mmHg)',
    sourceIds: ['src_aha_acc_bp'],
    illustrative: true,
  },
  body_temp: {
    indicatorId: 'body_temp',
    displayText: '36.1 to 37.2 °C',
    sourceIds: ['src_general_clinical'],
    illustrative: true,
  },
  glucose: {
    indicatorId: 'glucose',
    displayText: '70 to 99 mg/dL fasting',
    sourceIds: ['src_ada_glucose'],
    illustrative: true,
  },
  sleep_hours: {
    indicatorId: 'sleep_hours',
    displayText: '7 hours or more',
    sourceIds: ['src_aasm_sleep'],
    illustrative: true,
  },
  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    displayText: '96 minutes or more (scheduled plan)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  mood: {
    indicatorId: 'mood',
    displayText: '3 or above (1 low to 5 good)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  stress: {
    indicatorId: 'stress',
    displayText: '3 or below (1 calm to 5 high)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  energy: {
    indicatorId: 'energy',
    displayText: '3 or above (1 low to 5 high)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  radiation_dose: {
    indicatorId: 'radiation_dose',
    displayText: 'up to 1.5× the expected rate for the mission setting',
    sourceIds: ['src_csa_radiation'],
    illustrative: true,
  },
};

// ── classifyValue ─────────────────────────────────────────────────────────────
//
// Boundaries per ARCHITECTURE.md 7.1 (inclusive on the lower end of the next category).
// Radiation uses ratios relative to the expected mission rate; setting is required for it.

export function classifyValue(
  indicatorId: IndicatorId,
  value: number,
  setting?: MissionSettingId,
): ValueClass {
  switch (indicatorId) {
    case 'heart_rate':
      // normal 60–100; borderline 50–59 or 101–110; out_of_range <50 or >110
      if (value < 50) return 'out_of_range';
      if (value <= 59) return 'borderline';
      if (value <= 100) return 'normal';
      if (value <= 110) return 'borderline';
      return 'out_of_range';

    case 'bp_sys':
      // urgent ≥180; out_of_range 140–179 or <80; borderline 120–139 or 80–89; normal <120 (and ≥90)
      if (value >= 180) return 'urgent';
      if (value >= 140) return 'out_of_range';
      if (value >= 120) return 'borderline';
      if (value >= 90) return 'normal';
      if (value >= 80) return 'borderline';
      return 'out_of_range';

    case 'bp_dia':
      // urgent ≥120; out_of_range 90–119 or <50; borderline 80–89 or 50–59; normal <80 (and ≥60)
      if (value >= 120) return 'urgent';
      if (value >= 90) return 'out_of_range';
      if (value >= 80) return 'borderline';
      if (value >= 60) return 'normal';
      if (value >= 50) return 'borderline';
      return 'out_of_range';

    case 'body_temp':
      // normal 36.1–37.2; borderline 37.3–37.9 or 35.5–36.0; out_of_range ≥38.0 or <35.5
      if (value >= 38.0) return 'out_of_range';
      if (value >= 37.3) return 'borderline';
      if (value >= 36.1) return 'normal';
      if (value >= 35.5) return 'borderline';
      return 'out_of_range';

    case 'glucose':
      // urgent <54; out_of_range ≥126 or 54–69; borderline 100–125; normal 70–99
      if (value < 54) return 'urgent';
      if (value <= 69) return 'out_of_range';
      if (value <= 99) return 'normal';
      if (value <= 125) return 'borderline';
      return 'out_of_range';

    case 'sleep_hours':
      // normal ≥7; borderline 6.0–6.9; out_of_range <6.0
      if (value >= 7) return 'normal';
      if (value >= 6.0) return 'borderline';
      return 'out_of_range';

    case 'exercise_minutes':
      // normal ≥96; borderline 60–95; out_of_range <60
      if (value >= 96) return 'normal';
      if (value >= 60) return 'borderline';
      return 'out_of_range';

    case 'mood':
      // normal ≥3; borderline 2.0–2.9; out_of_range <2.0
      if (value >= 3) return 'normal';
      if (value >= 2.0) return 'borderline';
      return 'out_of_range';

    case 'stress':
      // normal ≤3; borderline 3.1–3.9; out_of_range ≥4.0
      if (value <= 3) return 'normal';
      if (value < 4.0) return 'borderline';
      return 'out_of_range';

    case 'energy':
      // normal ≥3; borderline 2.0–2.9; out_of_range <2.0
      if (value >= 3) return 'normal';
      if (value >= 2.0) return 'borderline';
      return 'out_of_range';

    case 'radiation_dose': {
      // out_of_range >2.5×rate; borderline 1.5–2.5×rate; normal ≤1.5×rate
      // Requires setting; if not provided, return 'normal' (cannot classify without rate).
      if (!setting) return 'normal';
      const rate = MISSION_SETTINGS[setting].radiationRateMsvPerDay;
      const ratio = value / rate;
      if (ratio > 2.5) return 'out_of_range';
      if (ratio > 1.5) return 'borderline';
      return 'normal';
    }

    default:
      // Exhaustive check — TypeScript will error here if a new indicator is added.
      return 'normal';
  }
}

