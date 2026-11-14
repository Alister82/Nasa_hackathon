import type { MeasurementHelp, IndicatorId } from '@/contracts/types';

// Measurement help text for all 11 indicators per ARCHITECTURE.md 7.1 and CONTRACTS.md.
// Text is general and non-prescriptive. No forbidden words (RULES.md 10).
// hazards entries must be one of the five HRP hazard names exactly.
// All text is ILLUSTRATIVE and has not been verified by a health professional.

const HRP_HAZARDS = {
  radiation: 'radiation',
  isolation: 'isolation and confinement',
  distance: 'distance from Earth',
  alteredGravity: 'altered gravity',
  hostile: 'hostile closed environment',
} as const;

export const MEASUREMENT_HELP: Record<IndicatorId, MeasurementHelp> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    howToMeasure:
      'Sit quietly for 5 minutes. Place two fingers on the inside of your wrist below the thumb, feel your pulse, and count the beats for 30 seconds, then multiply by 2. ' +
      'Alternatively, use your wrist heart-rate monitor according to the device manual.',
    whyItMatters:
      'Resting heart rate reflects how hard the cardiovascular system is working and can change with physical deconditioning, hydration, stress, and adaptation to altered gravity.',
    hazards: [HRP_HAZARDS.alteredGravity, HRP_HAZARDS.isolation, HRP_HAZARDS.hostile],
  },

  bp_sys: {
    indicatorId: 'bp_sys',
    howToMeasure:
      'Sit with your back supported and feet flat for 5 minutes before measuring. ' +
      'Wrap the cuff around your upper arm at heart level, start the measurement, and remain still and quiet until it is complete. ' +
      'Record both numbers shown on the display.',
    whyItMatters:
      'Blood pressure reflects the force on blood vessel walls and can change with fluid shifts, physical deconditioning, and other spaceflight adaptations.',
    hazards: [HRP_HAZARDS.alteredGravity, HRP_HAZARDS.hostile],
  },

  bp_dia: {
    indicatorId: 'bp_dia',
    howToMeasure:
      'Measured at the same time as systolic blood pressure using the cuff. ' +
      'Record the lower number shown on the display after the cuff deflates.',
    whyItMatters:
      'Diastolic pressure reflects the pressure in blood vessels between heartbeats and is tracked alongside systolic pressure to understand cardiovascular changes.',
    hazards: [HRP_HAZARDS.alteredGravity, HRP_HAZARDS.hostile],
  },

  body_temp: {
    indicatorId: 'body_temp',
    howToMeasure:
      'Use a thermometer placed at the correct location according to the device manual (oral, axillary, or tympanic). ' +
      'Wait the full measurement time before reading. ' +
      'Avoid eating, drinking, or vigorous activity for at least 15 minutes before an oral reading.',
    whyItMatters:
      'Body temperature can change with exertion, the closed-environment microclimate, and immune responses, making it a useful general health marker.',
    hazards: [HRP_HAZARDS.hostile, HRP_HAZARDS.radiation],
  },

  glucose: {
    indicatorId: 'glucose',
    howToMeasure:
      'For a fasting reading, take the measurement before eating or drinking anything other than water. ' +
      'Follow the glucose meter manual: clean the finger, insert a test strip, apply a small blood drop, and read the result.',
    whyItMatters:
      'Blood glucose reflects energy balance and metabolic function, which can be affected by altered sleep, stress, and changes in diet and exercise in a closed environment.',
    hazards: [HRP_HAZARDS.hostile, HRP_HAZARDS.isolation],
  },

  sleep_hours: {
    indicatorId: 'sleep_hours',
    howToMeasure:
      'Log the total hours of sleep from the time you fell asleep to the time you woke up, not including time spent awake in bed. ' +
      'Round to the nearest 15 minutes.',
    whyItMatters:
      'Sleep duration affects cognitive performance, mood, and physical recovery, and is closely watched during long missions because of circadian disruption.',
    hazards: [HRP_HAZARDS.isolation, HRP_HAZARDS.hostile, HRP_HAZARDS.distance],
  },

  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    howToMeasure:
      'Log the total minutes of planned exercise completed today, including resistance and cardiovascular sessions. ' +
      'Count only active exercise time, not warm-up or rest intervals.',
    whyItMatters:
      'Exercise adherence helps maintain cardiovascular fitness, bone density, and muscle strength during long exposure to altered gravity.',
    hazards: [HRP_HAZARDS.alteredGravity, HRP_HAZARDS.hostile],
  },

  mood: {
    indicatorId: 'mood',
    howToMeasure:
      'Rate how your mood feels overall today on a scale of 1 (low) to 5 (good). ' +
      'Choose the number that best reflects how your mood felt for most of the day.',
    whyItMatters:
      'Mood is tracked as part of behavioral health monitoring, since isolation, confinement, and distance from home can affect wellbeing over long missions.',
    hazards: [HRP_HAZARDS.isolation, HRP_HAZARDS.distance, HRP_HAZARDS.hostile],
  },

  stress: {
    indicatorId: 'stress',
    howToMeasure:
      'Rate your current stress level on a scale of 1 (calm) to 5 (high). ' +
      'Consider workload, interpersonal factors, and how tense or overwhelmed you feel.',
    whyItMatters:
      'Stress levels are tracked to support behavioral health, as the unique pressures of spaceflight can affect performance and wellbeing over time.',
    hazards: [HRP_HAZARDS.isolation, HRP_HAZARDS.distance, HRP_HAZARDS.hostile],
  },

  energy: {
    indicatorId: 'energy',
    howToMeasure:
      'Rate your overall energy level today on a scale of 1 (low) to 5 (high). ' +
      'Think about how alert, motivated, and physically capable you feel compared with your usual.',
    whyItMatters:
      'Energy levels reflect the combined effects of sleep, nutrition, workload, and adaptation, and can signal changes that warrant closer attention.',
    hazards: [HRP_HAZARDS.isolation, HRP_HAZARDS.hostile, HRP_HAZARDS.alteredGravity],
  },

  radiation_dose: {
    indicatorId: 'radiation_dose',
    howToMeasure:
      'Radiation dose is logged automatically from the dosimeter reading for each mission day. ' +
      'Record the daily dose in milliSieverts as reported by the dosimeter.',
    whyItMatters:
      'Tracking daily and cumulative radiation dose allows the crew and ground to compare readings against expected rates for the mission setting and to follow radiation procedures.',
    hazards: [HRP_HAZARDS.radiation, HRP_HAZARDS.distance],
  },
};

