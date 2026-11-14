import type { IndicatorId, MissionSettingId, ReferenceRange, ValueClass } from '@/contracts/types';
import { MISSION_SETTINGS } from './missionSettings';

// Reference ranges and classification per ARCHITECTURE.md 7.1.
// All values are ILLUSTRATIVE until a human verifies them.
// Boundaries are inclusive on the lower end of the next category
// (e.g. heart_rate 100 → normal, 101 → borderline).

export const REFERENCE_RANGES: Record<IndicatorId, ReferenceRange> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    displayText: '60 to 100 bpm at rest',
    sourceIds: ['src_general_clinical'],
    illustrative: true,
  },
  bp_sys: {
    indicatorId: 'bp_sys',
    displayText: 'Less than 120 mmHg (and at least 90 mmHg)',
    sourceIds: ['src_aha_acc_bp'],
    illustrative: true,
  },
  bp_dia: {
    indicatorId: 'bp_dia',
    displayText: 'Less than 80 mmHg (and at least 60 mmHg)',
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
    displayText: '70 to 99 mg/dL (fasting)',
    sourceIds: ['src_ada_glucose'],
    illustrative: true,
  },
  sleep_hours: {
    indicatorId: 'sleep_hours',
    displayText: 'At least 7 hours',
    sourceIds: ['src_aasm_sleep'],
    illustrative: true,
  },
  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    displayText: 'At least 96 minutes (illustrative; scheduled plan 120 min/day)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  mood: {
    indicatorId: 'mood',
    displayText: 'Score at least 3 (1 low to 5 good)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  stress: {
    indicatorId: 'stress',
    displayText: 'Score at most 3 (1 calm to 5 high)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  energy: {
    indicatorId: 'energy',
    displayText: 'Score at least 3 (1 low to 5 high)',
    sourceIds: ['src_hrp_hazards'],
    illustrative: true,
  },
  radiation_dose: {
    indicatorId: 'radiation_dose',
    displayText: 'At most 1.5 × expected daily rate for the mission setting (illustrative)',
    sourceIds: ['src_csa_radiation'],
    illustrative: true,
  },
};

/**
 * Classify a measured value for an indicator into a ValueClass.
 * Per ARCHITECTURE.md 7.1 boundary table (all ranges ILLUSTRATIVE).
 * For radiation_dose the setting is required to look up the expected rate.
 * Boundaries: inclusive on the lower end of the next category.
 */
export function classifyValue(
  indicatorId: IndicatorId,
  value: number,
  setting?: MissionSettingId,
): ValueClass {
  switch (indicatorId) {
    case 'heart_rate':
      // normal: 60–100; borderline: 50–59 or 101–110; out_of_range: <50 or >110; urgent: none
      if (value >= 60 && value <= 100) return 'normal';
      if ((value >= 50 && value <= 59) || (value >= 101 && value <= 110)) return 'borderline';
      return 'out_of_range';

    case 'bp_sys':
      // urgent: ≥180; normal: <120 (and ≥90); borderline: 120–139 or 80–89; out_of_range: 140–179 or <80
      if (value >= 180) return 'urgent';
      if (value >= 90 && value < 120) return 'normal';
      if ((value >= 120 && value <= 139) || (value >= 80 && value <= 89)) return 'borderline';
      if (value >= 140 && value <= 179) return 'out_of_range';
      // <80
      return 'out_of_range';

    case 'bp_dia':
      // urgent: ≥120; normal: <80 (and ≥60); borderline: 80–89 or 50–59; out_of_range: 90–119 or <50
      if (value >= 120) return 'urgent';
      if (value >= 60 && value < 80) return 'normal';
      if ((value >= 80 && value <= 89) || (value >= 50 && value <= 59)) return 'borderline';
      if (value >= 90 && value <= 119) return 'out_of_range';
      // <50
      return 'out_of_range';

    case 'body_temp':
      // normal: 36.1–37.2; borderline: 37.3–37.9 or 35.5–36.0; out_of_range: ≥38.0 or <35.5; urgent: none
      if (value >= 36.1 && value <= 37.2) return 'normal';
      if ((value >= 37.3 && value <= 37.9) || (value >= 35.5 && value <= 36.0)) return 'borderline';
      return 'out_of_range';

    case 'glucose':
      // urgent: <54; normal: 70–99; borderline: 100–125; out_of_range: ≥126 or 54–69
      if (value < 54) return 'urgent';
      if (value >= 70 && value <= 99) return 'normal';
      if (value >= 100 && value <= 125) return 'borderline';
      return 'out_of_range';

    case 'sleep_hours':
      // normal: ≥7; borderline: 6.0–6.9; out_of_range: <6.0; urgent: none
      if (value >= 7) return 'normal';
      if (value >= 6.0 && value < 7) return 'borderline';
      return 'out_of_range';

    case 'exercise_minutes':
      // normal: ≥96; borderline: 60–95; out_of_range: <60; urgent: none
      if (value >= 96) return 'normal';
      if (value >= 60 && value <= 95) return 'borderline';
      return 'out_of_range';

    case 'mood':
      // normal: ≥3; borderline: 2.0–2.9; out_of_range: <2.0; urgent: none
      if (value >= 3) return 'normal';
      if (value >= 2.0 && value < 3) return 'borderline';
      return 'out_of_range';

    case 'stress':
      // normal: ≤3; borderline: 3.1–3.9; out_of_range: ≥4.0; urgent: none
      if (value <= 3) return 'normal';
      if (value > 3 && value < 4) return 'borderline';
      return 'out_of_range';

    case 'energy':
      // normal: ≥3; borderline: 2.0–2.9; out_of_range: <2.0; urgent: none
      if (value >= 3) return 'normal';
      if (value >= 2.0 && value < 3) return 'borderline';
      return 'out_of_range';

    case 'radiation_dose': {
      // ≤1.5×rate → normal; 1.5–2.5×rate → borderline; >2.5×rate → out_of_range; urgent: none
      // Uses the mission setting's radiation rate; default to deep_space if not provided.
      const usedSetting: MissionSettingId = setting ?? 'deep_space';
      const rate = MISSION_SETTINGS[usedSetting].radiationRateMsvPerDay;
      const ratio = value / rate;
      if (ratio <= 1.5) return 'normal';
      if (ratio <= 2.5) return 'borderline';
      return 'out_of_range';
    }

    default: {
      // Exhaustiveness guard — TypeScript should never reach here.
      const _exhaustive: never = indicatorId;
      return _exhaustive;
    }
  }
}

