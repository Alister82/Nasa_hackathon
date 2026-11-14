import type { IndicatorId, ReferenceRange, MeasurementHelp } from '@/contracts/types';

export const mockReferenceRanges: Record<IndicatorId, ReferenceRange> = {
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
    displayText: 'At least 96 minutes (illustrative; plan 120 min/day)',
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
    displayText: 'At most 1.5 × expected daily rate',
    sourceIds: ['src_csa_radiation'],
    illustrative: true,
  },
};

export const mockMeasurementHelp: Record<IndicatorId, MeasurementHelp> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    howToMeasure:
      'Sit quietly for 5 minutes. Feel your pulse on your wrist for 30 seconds and double it, or use your wrist heart-rate monitor.',
    whyItMatters:
      'Resting heart rate reflects cardiovascular load and changes with fitness, hydration, stress, and adaptation to weightlessness.',
    hazards: ['altered gravity', 'isolation and confinement'],
  },
  bp_sys: {
    indicatorId: 'bp_sys',
    howToMeasure:
      'Sit supported for 5 minutes with feet flat. Wrap cuff at heart level, remain still and quiet during measurement, and record the top number.',
    whyItMatters:
      'Systolic blood pressure reflects vascular resistance and fluid shifts occurring during spaceflight.',
    hazards: ['altered gravity'],
  },
  bp_dia: {
    indicatorId: 'bp_dia',
    howToMeasure:
      'Measured concurrently with systolic pressure using the cuff. Record the bottom number.',
    whyItMatters:
      'Diastolic pressure reflects baseline arterial pressure between beats.',
    hazards: ['altered gravity'],
  },
  body_temp: {
    indicatorId: 'body_temp',
    howToMeasure:
      'Use the cabin digital thermometer. Avoid eating or hot/cold fluids for 15 minutes before reading.',
    whyItMatters:
      'Body temperature is a fundamental marker of metabolic rate and immune responses.',
    hazards: ['hostile closed environment'],
  },
  glucose: {
    indicatorId: 'glucose',
    howToMeasure:
      'Use blood glucose meter with a fresh test strip before meals (fasting). Follow device instructions.',
    whyItMatters:
      'Tracks energy regulation and metabolic responses to closed-loop nutrition and altered sleep schedules.',
    hazards: ['hostile closed environment'],
  },
  sleep_hours: {
    indicatorId: 'sleep_hours',
    howToMeasure:
      'Log total hours slept during your sleep shift, rounding to nearest 15 minutes.',
    whyItMatters:
      'Sleep is vital for cognitive performance and physiological recovery under confinement.',
    hazards: ['isolation and confinement', 'distance from Earth'],
  },
  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    howToMeasure:
      'Log completed active exercise time from your daily countermeasure session.',
    whyItMatters:
      'Counteracts bone density loss, muscle atrophy, and cardiovascular deconditioning.',
    hazards: ['altered gravity'],
  },
  mood: {
    indicatorId: 'mood',
    howToMeasure:
      'Rate your overall mood today on a scale of 1 (low) to 5 (good).',
    whyItMatters:
      'Behavioral health self-checks help monitor adaptation to confinement and distance.',
    hazards: ['isolation and confinement'],
  },
  stress: {
    indicatorId: 'stress',
    howToMeasure:
      'Rate your stress level on a scale of 1 (calm) to 5 (high).',
    whyItMatters:
      'Assesses cognitive and emotional load in closed environments.',
    hazards: ['isolation and confinement'],
  },
  energy: {
    indicatorId: 'energy',
    howToMeasure:
      'Rate your energy level on a scale of 1 (low) to 5 (high).',
    whyItMatters:
      'Reflects fatigue, circadian alignment, and overall recovery.',
    hazards: ['isolation and confinement'],
  },
  radiation_dose: {
    indicatorId: 'radiation_dose',
    howToMeasure:
      'Read and record daily dose in mSv from active crew dosimeter.',
    whyItMatters:
      'Monitors exposure from galactic cosmic rays and solar particle events.',
    hazards: ['radiation'],
  },
};

