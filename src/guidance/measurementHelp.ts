/**
 * G3: measurementHelp.ts
 * Short, general, non-prescriptive how-to-measure and why-it-matters text for all 11 indicators.
 * Hazards must be from the five HRP names only:
 *   'radiation', 'isolation and confinement', 'distance from Earth',
 *   'altered gravity', 'hostile closed environment'
 *
 * Text is general and non-clinical. Nothing here constitutes medical advice.
 * All entries are ILLUSTRATIVE; a human should review the copy.
 *
 * ARCHITECTURE.md 6.1 — 11 indicators listed.
 * CONTRACTS.md MeasurementHelp — howToMeasure 1–3 sentences; whyItMatters 1 sentence; hazards from the five names.
 */
import type { MeasurementHelp, IndicatorId } from '@/contracts/types';

// The five allowed hazard names (ARCHITECTURE.md / PDR.md section 2).
export const ALLOWED_HAZARDS = [
  'radiation',
  'isolation and confinement',
  'distance from Earth',
  'altered gravity',
  'hostile closed environment',
] as const;

export type AllowedHazard = (typeof ALLOWED_HAZARDS)[number];

export const MEASUREMENT_HELP: Record<IndicatorId, MeasurementHelp> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    howToMeasure:
      'Sit quietly for 5 minutes before measuring. Place the wrist sensor or count your pulse at the wrist for 30 seconds and double the result. Take the reading before any exercise or caffeine.',
    whyItMatters:
      'Resting heart rate is a simple indicator of how the cardiovascular system is responding to spaceflight.',
    hazards: ['altered gravity', 'isolation and confinement'],
  },

  bp_sys: {
    indicatorId: 'bp_sys',
    howToMeasure:
      'Sit quietly for 5 minutes with back supported and feet flat before measuring. Keep the cuff at heart level and remain still and quiet during the reading. Take two readings a minute apart and record both.',
    whyItMatters:
      'Systolic blood pressure is the peak force of each heartbeat and can change with fluid shifts in microgravity.',
    hazards: ['altered gravity', 'isolation and confinement'],
  },

  bp_dia: {
    indicatorId: 'bp_dia',
    howToMeasure:
      'Measure at the same time and in the same position as systolic blood pressure. Diastolic is recorded automatically by the same cuff reading.',
    whyItMatters:
      'Diastolic blood pressure reflects the pressure between heartbeats and is tracked alongside systolic for a complete picture.',
    hazards: ['altered gravity', 'isolation and confinement'],
  },

  body_temp: {
    indicatorId: 'body_temp',
    howToMeasure:
      'Use a thermometer as directed by your crew medical kit instructions. Avoid measuring immediately after eating, drinking, or strenuous activity.',
    whyItMatters:
      'Body temperature can be a sign that the body is working harder than usual, which is worth tracking in a closed environment.',
    hazards: ['hostile closed environment', 'isolation and confinement'],
  },

  glucose: {
    indicatorId: 'glucose',
    howToMeasure:
      'Take this reading in the fasting state (no food for at least 8 hours). Follow the glucometer instructions exactly, including finger-stick technique and test-strip handling. Record the time of your last meal.',
    whyItMatters:
      'Fasting blood glucose reflects how the body is managing energy, which can be affected by changes to sleep, exercise, and nutrition in spaceflight.',
    hazards: ['altered gravity', 'hostile closed environment'],
  },

  sleep_hours: {
    indicatorId: 'sleep_hours',
    howToMeasure:
      'Record the number of hours you slept in your last sleep period, including time spent in restful sleep. Estimate to the nearest half-hour if you are not sure.',
    whyItMatters:
      'Sleep duration is closely linked to recovery, alertness, and overall wellbeing, which are especially important in isolated environments.',
    hazards: ['isolation and confinement', 'altered gravity'],
  },

  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    howToMeasure:
      'Log the total minutes spent in planned physical activity since your last log. Count only structured exercise sessions, not general movement.',
    whyItMatters:
      'Regular exercise is a key countermeasure for maintaining muscle and cardiovascular fitness during spaceflight.',
    hazards: ['altered gravity', 'isolation and confinement'],
  },

  mood: {
    indicatorId: 'mood',
    howToMeasure:
      'Rate overall mood since the last check-in on a scale from 1 (low) to 5 (good). There is no right or wrong answer; honesty helps.',
    whyItMatters:
      'Mood reflects psychological wellbeing, which can be affected by isolation, confinement, and the demands of long-duration missions.',
    hazards: ['isolation and confinement', 'distance from Earth'],
  },

  stress: {
    indicatorId: 'stress',
    howToMeasure:
      'Rate your overall stress level since your last check-in on a scale from 1 (calm) to 5 (high). Consider workload, interpersonal dynamics, and any personal concerns.',
    whyItMatters:
      'Tracking stress helps identify when crew support or schedule adjustments may be helpful before it affects performance.',
    hazards: ['isolation and confinement', 'distance from Earth'],
  },

  energy: {
    indicatorId: 'energy',
    howToMeasure:
      'Rate overall energy since the last check-in on a scale from 1 (low) to 5 (high). Consider physical and mental energy together.',
    whyItMatters:
      'Energy level reflects how well the body and mind are recovering, which can be an early sign that rest or other adjustments may help.',
    hazards: ['isolation and confinement', 'altered gravity'],
  },

  radiation_dose: {
    indicatorId: 'radiation_dose',
    howToMeasure:
      'The radiation dose is read automatically from the dosimeter on board. Record the daily reading shown on the dosimeter display.',
    whyItMatters:
      'Tracking daily radiation dose against the expected level for the mission setting helps detect unusual exposure events.',
    hazards: ['radiation', 'distance from Earth'],
  },
};

